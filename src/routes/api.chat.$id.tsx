import { createServerFileRoute } from "@tanstack/react-start/server";
import { type UIMessage, convertToModelMessages } from "ai";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/db";
import { chats, messages, MessageRole, type NewMessage, type NewChat } from "@/db/schema";
import { auth } from "@/lib/auth-server";
import { ChatService } from "@/services/chat-service";
import { LLMProviderService } from "@/services/llm-provider-service";
import { LLMService } from "@/services/llm-service";

async function handler({ request, params }: { request: Request; params: { id: string } }) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return new Response(
				JSON.stringify({ error: "Unauthorized" }),
				{
					status: 401,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const {
			messages: uiMessages,
			system,
			providerId,
			model,
			temperature,
		}: {
			messages: UIMessage[];
			system?: string;
			providerId?: string;
			model?: string;
			temperature?: number;
		} = await request.json();

		const chatId = params.id;
		let chat;

		// Check if chat exists or create new one
		if (chatId === "new") {
			// Create new chat
			const newChatId = nanoid();
			const newChat: NewChat = {
				id: newChatId,
				userId: session.user.id,
				title: "New Chat",
				systemPrompt: system,
				llmProviderId: providerId,
			};

			await db.insert(chats).values(newChat);
			chat = newChat;
		} else {
			// Get existing chat with provider
			const chatWithProvider = await ChatService.getChatWithProvider(chatId, session.user.id);
			if (!chatWithProvider) {
				return new Response(
					JSON.stringify({ error: "Chat not found" }),
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			chat = chatWithProvider;
		}

		// Determine which provider to use
		let llmProvider;
		if (providerId) {
			// Use specified provider
			llmProvider = await LLMProviderService.getProviderById(providerId, session.user.id);
		} else if (chat.llmProviderId) {
			// Use chat's default provider
			llmProvider = await LLMProviderService.getProviderById(chat.llmProviderId, session.user.id);
		} else {
			// Get user's first active provider
			const providers = await LLMProviderService.getUserProviders(session.user.id);
			llmProvider = providers[0];
		}

		if (!llmProvider) {
			return new Response(
				JSON.stringify({
					error: "No LLM provider configured. Please add a provider in settings.",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Store user message in database
		if (uiMessages.length > 0) {
			const lastMessage = uiMessages[uiMessages.length - 1];
			if (lastMessage.role === "user") {
				const newMessage: NewMessage = {
					id: nanoid(),
					chatId: chat.id,
					role: MessageRole.USER,
					content: lastMessage.content,
				};
				await db.insert(messages).values(newMessage);

				// Update chat title if it's the first message
				if (chat.title === "New Chat") {
					const title = lastMessage.content.slice(0, 50) + (lastMessage.content.length > 50 ? "..." : "");
					await db
						.update(chats)
						.set({ title, updatedAt: new Date() })
						.where(eq(chats.id, chat.id));
				}
			}
		}

		// Convert UI messages to model messages format (AI SDK v5)
		const modelMessages = convertToModelMessages(uiMessages);

		// Get LLM configuration
		const llmConfig = {
			...LLMService.getDefaultConfig(llmProvider.providerType),
			...(llmProvider.config || {}),
			...(model && { model }),
			...(temperature !== undefined && { temperature }),
		};

		// Stream response using the appropriate provider
		const result = await LLMService.streamChat(
			llmProvider,
			modelMessages,
			llmConfig,
			chat.systemPrompt || system,
			session.user.id
		);

		// Add onFinish callback to store assistant response
		result.onFinish(async (result) => {
			const assistantMessage: NewMessage = {
				id: nanoid(),
				chatId: chat.id,
				role: MessageRole.ASSISTANT,
				content: result.text,
			};
			await db.insert(messages).values(assistantMessage);
		});

		// Return the UI message stream response (AI SDK v5)
		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error("Chat API Error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Failed to process chat request. Please try again.",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

export const ServerRoute = createServerFileRoute("/api/chat/$id").methods({
	POST: handler,
});