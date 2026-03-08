import { createFileRoute } from "@tanstack/react-router";
import { getTokenCosts } from "@tokenlens/helpers";
import {
	createAgentUIStreamResponse,
	type LanguageModelUsage,
	stepCountIs,
	ToolLoopAgent,
	validateUIMessages,
} from "ai";
import { fetchModels } from "tokenlens";
import { auth } from "@/lib/auth";
import { buildPathEndingAt, ensureParentIds } from "@/lib/chat-branching";
import { countUIMessageTokens, generateMessageId } from "@/lib/chat-utils";
import { addMessageToChat, loadChat, saveChat } from "@/services/chat-service";
import {
	getDefaultLLMProviderKey,
	hasValidLLMProviderKey,
} from "@/services/llm-provider-service";
import { MessageStatus, type UIMessage } from "@/types/chat";
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

					const {
						message,
						provider = LLMProvider.OPENAI,
						model,
						trigger,
						parentId: requestParentId,
					}: {
						message: UIMessage;
						system?: string;
						chatId?: string;
						provider?: LLMProvider;
						model: string;
						trigger?: "submit-message" | "regenerate-message";
						parentId?: string | null;
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

					const currentChatId = requestChatId;

					if (message.metadata?.status === "pending") {
						message.metadata = {
							...message.metadata,
							status: MessageStatus.COMPLETE,
						};
					}

					// Load ALL existing messages from database (including branches)
					const { messages: existingMessages } = await loadChat(
						requestChatId,
						session.user.id,
					);

					// Ensure all messages have parentId (backward compat for legacy linear chats)
					const allStoredMessages = ensureParentIds(existingMessages);

					let promptMessages: UIMessage[];
					let userMessageId: string | undefined;

					if (trigger === "regenerate-message") {
						// Branch-aware regeneration: create a NEW sibling assistant response
						// The message sent is the USER message to regenerate from
						userMessageId = message.id;

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

						// Build prompt path ending at the user message
						promptMessages = buildPathEndingAt(
							allStoredMessages,
							userMessageId,
						);

						if (promptMessages.length === 0) {
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
					} else {
						// Normal message submission flow
						// Set parentId on the new user message
						const resolvedParentId =
							requestParentId !== undefined
								? requestParentId
								: (message.metadata?.parentId ?? null);

						message.metadata = {
							modelId: message.metadata?.modelId ?? null,
							totalUsage: message.metadata?.totalUsage ?? null,
							cost: message.metadata?.cost ?? null,
							status: message.metadata?.status ?? null,
							messageTokens: message.metadata?.messageTokens ?? 0,
							parentId: resolvedParentId,
						};

						// Check if message already exists (pending → complete update)
						if (
							existingMessages[existingMessages.length - 1]?.id === message.id
						) {
							const allMessages = [...existingMessages.slice(0, -1), message];
							await saveChat({
								chatId: currentChatId,
								userId: session.user.id,
								messages: allMessages,
							});
						} else {
							const allMessages = [...existingMessages, message];
							await saveChat({
								chatId: currentChatId,
								userId: session.user.id,
								messages: allMessages,
							});
						}

						userMessageId = message.id;

						// Build prompt path ending at the new user message
						const updatedMessages = ensureParentIds([
							...allStoredMessages.filter((m) => m.id !== message.id),
							message,
						]);
						promptMessages = buildPathEndingAt(updatedMessages, message.id);
					}

					// Validate prompt messages
					promptMessages = await validateUIMessages({
						messages: promptMessages,
					});

					if (!currentChatId) {
						throw new Error("Failed to get or create chat ID");
					}

					const aiSdkModel = getAIModel(provider, model, apiKey);

					const [tools, modelsData] = await Promise.all([
						getChatTools(session.user.id, currentChatId),
						fetchModels(provider),
					]);

					let usage: LanguageModelUsage | undefined;
					const codeAgent = new ToolLoopAgent({
						model: aiSdkModel,
						temperature: 0.7,
						tools,
						stopWhen: stepCountIs(25),
						providerOptions: getProviderOptions(),
						onFinish: async (finishResponse) => {
							const { totalUsage } = finishResponse;
							usage = totalUsage;
						},
					});

					console.log(
						"Starting agent execution with prompt messages:",
						JSON.stringify(promptMessages, null, 2),
					);

					return createAgentUIStreamResponse({
						agent: codeAgent,
						uiMessages: promptMessages,
						headers: {
							"X-Chat-ID": currentChatId,
						},
						sendReasoning: true,
						sendSources: true,

						onFinish: async ({ responseMessage }) => {
							const modelId = `${provider}:${model}`;
							const cost = modelsData
								? getTokenCosts({
										modelId: `${provider}/${model}`,
										usage: usage,
										providers: modelsData,
									})
								: null;

							// Save assistant response with parentId pointing to the user message
							await addMessageToChat({
								chatId: currentChatId,
								message: responseMessage,
								userId: session.user.id,
								parentId: userMessageId ?? null,
								messageMetadata: {
									totalUsage: usage || null,
									modelId,
									status: MessageStatus.COMPLETE,
									cost: cost,
									messageTokens: countUIMessageTokens(responseMessage),
									parentId: userMessageId ?? null,
								},
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
