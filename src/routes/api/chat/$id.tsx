import { auth } from "@/lib/auth";
import { generateMessageId } from "@/lib/chat-utils";
import { loadChat, saveChat } from "@/services/chat-service";
import {
	getDefaultLLMProviderKey,
	hasValidLLMProviderKey,
} from "@/services/llm-provider-service";
import { LLMProvider } from "@/types/models";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createServerFileRoute } from "@tanstack/react-start/server";
import {
	type ToolSet,
	type UIMessage,
	convertToModelMessages,
	stepCountIs,
	streamText,
	validateUIMessages,
} from "ai";

import { env } from "@/env";
import { findMcpServer } from "@/integrations/trpc/router/mcp-server";
import { StreamableHTTPClientTransport } from "@socotra/modelcontextprotocol-sdk/client/streamableHttp.js";
import { experimental_createMCPClient as createMCPClient } from "ai";

export const ServerRoute = createServerFileRoute("/api/chat/$id").methods({
	POST: async ({ request, params }) => {
		try {
			// Get authenticated user
			const session = await auth.api.getSession({ headers: request.headers });
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
			const apiKey = await getDefaultLLMProviderKey(session.user.id, provider);
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
			// If we have a chat ID but only one message, we need to load existing messages
			// and append the new one (this handles the prepareSendMessagesRequest pattern)
			let allMessages = [message];

			const { chat, messages: existingMessages } = await loadChat(
				requestChatId,
				session.user.id,
			);
			allMessages = [...existingMessages, ...allMessages];
			allMessages = await validateUIMessages({
				messages: allMessages,
			});

			// Ensure we have a valid chat ID
			if (!currentChatId) {
				throw new Error("Failed to get or create chat ID");
			}

			// Save the new message to the database

			saveChat({
				chatId: currentChatId,
				userId: session.user.id,
				messages: allMessages,
			});
			// Convert UI messages to model messages format (AI SDK v5)
			const modelMessages = convertToModelMessages(allMessages);

			const aiSdkModel = getAIModel(provider, model, apiKey);

			const tools: ToolSet = {};
			if (
				chat.metadata?.selectedServers &&
				Array.isArray(chat.metadata.selectedServers)
			) {
				for (const serverId of chat.metadata.selectedServers) {
					const server = await findMcpServer(serverId, session.user.id);
					if (server) {
						const httpTransport = new StreamableHTTPClientTransport(
							new URL(`${env.SERVER_URL}/api/mcp/${server.token}`),
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
						Object.assign(tools, serverTools);
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
			})(model || "gpt-5-mini");
		case LLMProvider.ANTHROPIC:
			return createAnthropic({
				apiKey: apiKey,
			})(model || "claude-3.5-haiku");
		case LLMProvider.GOOGLE:
			return createGoogleGenerativeAI({
				apiKey: apiKey,
			})(model || "gemini-2.5-flash");
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}
