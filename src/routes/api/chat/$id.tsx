import { createFileRoute } from "@tanstack/react-router";
import {
	createAgentUIStreamResponse,
	stepCountIs,
	ToolLoopAgent,
	type UIMessage,
	validateUIMessages,
} from "ai";

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
import { getAIModel, getProviderOptions } from "./-libs/models";
import { getChatTools } from "./-libs/tools";

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
					const { messages: existingMessages } = await loadChat(
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
						if (messagesAfterUser.length > 0) {
							await deleteMessageAndAfter(
								currentChatId,
								messagesAfterUser[0].id,
								session.user.id,
							);
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
					// const modelMessages = await convertToModelMessages(allMessages);

					const aiSdkModel = getAIModel(provider, model, apiKey);

					const tools = await getChatTools(session.user.id, currentChatId);

					const codeAgent = new ToolLoopAgent({
						model: aiSdkModel,
						temperature: 0.7,
						tools,
						stopWhen: stepCountIs(25),
						providerOptions: getProviderOptions(),
					});

					// Return the UI message stream response (AI SDK v5)
					return createAgentUIStreamResponse({
						agent: codeAgent,
						uiMessages: allMessages,
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
