import { auth } from "@/lib/auth";
import { generateMessageId } from "@/lib/chat-utils";
import {
	deleteMessageAndAfter,
	loadChat,
	saveChat,
} from "@/services/chat-service";
import {
	getDefaultLLMProviderKey,
	hasValidLLMProviderKey,
} from "@/services/llm-provider-service";
import { LLMProvider } from "@/types/models";
import {
	type AnthropicProviderOptions,
	createAnthropic,
} from "@ai-sdk/anthropic";
import {
	type GoogleGenerativeAIProviderOptions,
	createGoogleGenerativeAI,
} from "@ai-sdk/google";
import { type GroqProviderOptions, createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import {
	type OpenAIResponsesProviderOptions,
	createOpenAI,
} from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createFileRoute } from "@tanstack/react-router";
import {
	type ToolSet,
	type UIMessage,
	convertToModelMessages,
	smoothStream,
	stepCountIs,
	streamText,
	validateUIMessages,
} from "ai";

import { db } from "@/db";
import { chatMcpServers, mcpServer } from "@/db/schema";
import { env } from "@/env";
import { eq } from "drizzle-orm";

import { StreamableHTTPClientTransport } from "@socotra/modelcontextprotocol-sdk/client/streamableHttp.js";
import { experimental_createMCPClient as createMCPClient } from "ai";

export const Route = createFileRoute("/api/chat/$id")({
	server: {
		handlers: {
			POST: async ({ request, params }) => {
				try {
					// Get authenticated user
					const session = await auth.api.getSession({
						headers: request.headers,
					});
					if (!session?.user) {
						return new Response(JSON.stringify({ error: "Unauthorized" }), {
							status: 401,
							headers: { "Content-Type": "application/json" },
						});
					}

					const requestChatId = params.id;
					const body = await request.json();

					// Default: Handle chat streaming
					const {
						message,
						system,
						provider = LLMProvider.OPENAI, // Default to OpenAI
						model,
						trigger,
					}: {
						message: UIMessage;
						system?: string;
						chatId?: string;
						provider?: LLMProvider;
						model?: string;
						trigger?: "submit-message" | "regenerate-message";
					} = body;

					// Check if user has valid API keys for any provider
					const hasAnyValidKey = await hasValidLLMProviderKey(session.user.id);
					if (!hasAnyValidKey) {
						return new Response(
							JSON.stringify({
								error:
									"No valid API keys found. Please add an API key in settings to use the chat feature.",
								code: "NO_API_KEYS",
							}),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// Get the user's API key for the specified provider
					const apiKey = await getDefaultLLMProviderKey(
						session.user.id,
						provider,
					);
					if (!apiKey) {
						return new Response(
							JSON.stringify({
								error: `No valid ${provider} API key found. Please add a ${provider} API key in settings.`,
								code: "NO_PROVIDER_KEY",
							}),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					// Get or create chat ID
					const currentChatId = requestChatId;

					if ((message.metadata as { status: string })?.status === "pending") {
						message.metadata = {
							status: "done",
						};
					}

					// Load existing messages from database
					const { chat, messages: existingMessages } = await loadChat(
						requestChatId,
						session.user.id,
					);

					let allMessages: UIMessage[];

					// Handle regenerate-message trigger
					if (trigger === "regenerate-message") {
						// When regenerating, the message sent is the USER message that needs a new response
						// We need to:
						// 1. Find the user message in the database
						// 2. Delete all ASSISTANT messages that came after it
						// 3. Keep all messages up to and including the user message for context
						// 4. Send to LLM to generate new response

						const userMessageId = message.id;

						if (!userMessageId) {
							return new Response(
								JSON.stringify({
									error: "Message ID is required for regeneration",
								}),
								{
									status: 400,
									headers: { "Content-Type": "application/json" },
								},
							);
						}

						// Load current messages to find what comes after the user message
						const { messages: currentMessages } = await loadChat(
							requestChatId,
							session.user.id,
						);

						// Find the index of the user message
						const userMessageIndex = currentMessages.findIndex(
							(msg) => msg.id === userMessageId,
						);

						if (userMessageIndex === -1) {
							return new Response(
								JSON.stringify({
									error: "User message not found for regeneration",
								}),
								{
									status: 400,
									headers: { "Content-Type": "application/json" },
								},
							);
						}

						// Find all messages after the user message (these are the ones to delete)
						const messagesAfterUser = currentMessages.slice(
							userMessageIndex + 1,
						);

						// Delete all messages after the user message
						for (const msg of messagesAfterUser) {
							if (msg.id) {
								await deleteMessageAndAfter(
									currentChatId,
									msg.id,
									session.user.id,
								);
							}
						}

						// Reload messages after deletion
						const { messages: messagesAfterDeletion } = await loadChat(
							requestChatId,
							session.user.id,
						);

						// Use the updated message list (should end with the user message)
						allMessages = messagesAfterDeletion;

						// Ensure we have at least one message after deletion
						if (allMessages.length === 0) {
							return new Response(
								JSON.stringify({
									error: "No messages available for regeneration",
								}),
								{
									status: 400,
									headers: { "Content-Type": "application/json" },
								},
							);
						}
					} else {
						// Normal message submission flow
						// Append the new message to existing messages

						if (
							existingMessages[existingMessages.length - 1]?.id === message.id
						) {
							// merge with last message (to update status from pending to done)
							allMessages = [...existingMessages.slice(0, -1), message];
						} else {
							allMessages = [...existingMessages, message];
						}

						// Save the new user message immediately
						await saveChat({
							chatId: currentChatId,
							userId: session.user.id,
							messages: allMessages,
						});
					} // Validate all messages
					allMessages = await validateUIMessages({
						messages: allMessages,
					});

					// Ensure we have a valid chat ID
					if (!currentChatId) {
						throw new Error("Failed to get or create chat ID");
					}
					// Convert UI messages to model messages format (AI SDK v5)
					const modelMessages = convertToModelMessages(allMessages);

					const aiSdkModel = getAIModel(provider, model, apiKey);

					const tools: ToolSet = {};

					// Get chat MCP servers from the new table
					const chatMcpServersData = await db
						.select({
							chatMcpServer: chatMcpServers,
							mcpServerData: mcpServer,
						})
						.from(chatMcpServers)
						.leftJoin(mcpServer, eq(chatMcpServers.mcpServerId, mcpServer.id))
						.where(eq(chatMcpServers.chatId, chat.id));

					for (const {
						chatMcpServer: chatServer,
						mcpServerData: serverData,
					} of chatMcpServersData) {
						if (chatServer.isRemoteMcp && serverData) {
							// Handle remote MCP server
							const httpTransport = new StreamableHTTPClientTransport(
								new URL(`${env.SERVER_URL}/api/mcp/${serverData.token}`),
								{
									requestInit: {
										headers: {
											"x-API-Key": env.MCP_SERVER_API_KEY,
											"X-User-Id": session.user.id,
										},
									},
								},
							);

							const mcpClient = await createMCPClient({
								transport: httpTransport,
							});

							const serverTools = await mcpClient.tools();

							// Filter tools based on chat MCP server configuration
							if (chatServer.includeAllTools) {
								Object.assign(tools, serverTools);
							} else if (chatServer.tools && Array.isArray(chatServer.tools)) {
								// Only include selected tools
								for (const toolName of chatServer.tools) {
									if (serverTools[toolName]) {
										tools[toolName] = serverTools[toolName];
									}
								}
							}
						} else if (!chatServer.isRemoteMcp && chatServer.config) {
							// Handle direct MCP server configuration
							const { url, headers } = chatServer.config;
							if (url) {
								const httpTransport = new StreamableHTTPClientTransport(
									new URL(url),
									{
										requestInit: {
											headers: headers as Record<string, string> | undefined,
										},
									},
								);

								const mcpClient = await createMCPClient({
									transport: httpTransport,
								});

								const serverTools = await mcpClient.tools();

								// Filter tools based on chat MCP server configuration
								if (chatServer.includeAllTools) {
									Object.assign(tools, serverTools);
								} else if (
									chatServer.tools &&
									Array.isArray(chatServer.tools)
								) {
									// Only include selected tools
									for (const toolName of chatServer.tools) {
										if (serverTools[toolName]) {
											tools[toolName] = serverTools[toolName];
										}
									}
								}
							}
						}
					}

					const result = streamText({
						model: aiSdkModel,
						system,
						messages: modelMessages,
						temperature: 0.7,
						tools,
						stopWhen: stepCountIs(25),
						providerOptions: {
							openai: {
								reasoningEffort: "medium",
								reasoningSummary: "auto",
								textVerbosity: "medium",
							} satisfies OpenAIResponsesProviderOptions,
							anthropic: {
								thinking: { type: "enabled", budgetTokens: 12000 },
								sendReasoning: true,
							} satisfies AnthropicProviderOptions,
							google: {
								thinkingConfig: {
									includeThoughts: true,
								},
							} satisfies GoogleGenerativeAIProviderOptions,
							grok: {
								reasoningEffort: "medium",
							} satisfies GroqProviderOptions,
						},
						experimental_transform: [
							smoothStream({
								chunking: "word",
							}),
						],
					});

					result.consumeStream();

					// Return the UI message stream response (AI SDK v5)
					return result.toUIMessageStreamResponse({
						headers: {
							"X-Chat-ID": currentChatId, // Include chat ID for frontend navigation
						},
						sendReasoning: true,
						onFinish: async ({ messages }) => {
							await saveChat({
								chatId: currentChatId,
								messages: messages,
								userId: session.user.id,
							});
						},
						generateMessageId,
					});
				} catch (error) {
					console.error("Chat API Error:", error);
					return new Response(
						JSON.stringify({
							error: "Failed to process chat request. Please try again.",
						}),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});

function getAIModel(
	provider: LLMProvider,
	model: string | undefined,
	apiKey: string,
) {
	switch (provider) {
		case LLMProvider.OPENAI:
			return createOpenAI({
				apiKey: apiKey,
			})(model || "gpt-4o-mini");

		case LLMProvider.ANTHROPIC:
			return createAnthropic({
				apiKey: apiKey,
			})(model || "claude-3-5-sonnet-20241022");

		case LLMProvider.GOOGLE:
			return createGoogleGenerativeAI({
				apiKey: apiKey,
			})(model || "gemini-2.0-flash-exp");

		case LLMProvider.MISTRAL:
			return createMistral({
				apiKey: apiKey,
			})(model || "mistral-small-latest");

		case LLMProvider.GROQ:
			// Groq is OpenAI-compatible, use createOpenAI with Groq's base URL
			return createGroq({
				apiKey: apiKey,
				// baseURL: "https://api.groq.com/openai/v1",
			})(model || "llama-3.3-70b-versatile");

		case LLMProvider.ALIBABA:
			// Alibaba Cloud (Qwen) uses OpenAI-compatible API
			return createOpenAICompatible({
				apiKey: apiKey,
				baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
				name: "alibaba",
			})(model || "qwen3-max");

		case LLMProvider.GITHUB_MODELS:
			// GitHub Models uses OpenAI-compatible API
			return createOpenAICompatible({
				apiKey: apiKey,
				baseURL: "https://models.github.ai/inference",
				name: "github-models",
			})(model || "gpt-4.1-mini");

		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}
