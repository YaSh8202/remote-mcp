import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/db";
import {
	chats,
	messages,
	llmProviders,
	type Chat,
	type NewChat,
	type Message,
	type NewMessage,
	type LLMProvider,
	MessageRole,
} from "@/db/schema";

export class ChatService {
	static async createChat(userId: string, data: Partial<NewChat> = {}): Promise<Chat> {
		const newChat: NewChat = {
			id: nanoid(),
			userId,
			title: data.title || "New Chat",
			systemPrompt: data.systemPrompt,
			llmProviderId: data.llmProviderId,
			mcpServerIds: data.mcpServerIds || [],
			...data,
		};

		await db.insert(chats).values(newChat);
		return newChat as Chat;
	}

	static async getUserChats(userId: string): Promise<Chat[]> {
		return await db
			.select()
			.from(chats)
			.where(and(eq(chats.userId, userId), eq(chats.isArchived, false)))
			.orderBy(desc(chats.updatedAt));
	}

	static async getChatById(chatId: string, userId: string): Promise<Chat | null> {
		const result = await db
			.select()
			.from(chats)
			.where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
			.limit(1);

		return result[0] || null;
	}

	static async updateChat(chatId: string, userId: string, updates: Partial<Chat>): Promise<void> {
		await db
			.update(chats)
			.set({ ...updates, updatedAt: new Date() })
			.where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
	}

	static async deleteChat(chatId: string, userId: string): Promise<void> {
		await db
			.delete(chats)
			.where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
	}

	static async archiveChat(chatId: string, userId: string): Promise<void> {
		await db
			.update(chats)
			.set({ isArchived: true, updatedAt: new Date() })
			.where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
	}

	static async getChatMessages(chatId: string, userId: string): Promise<Message[]> {
		// First verify the chat belongs to the user
		const chat = await this.getChatById(chatId, userId);
		if (!chat) {
			throw new Error("Chat not found or access denied");
		}

		return await db
			.select()
			.from(messages)
			.where(eq(messages.chatId, chatId))
			.orderBy(messages.createdAt);
	}

	static async addMessage(chatId: string, userId: string, messageData: Omit<NewMessage, "id" | "chatId">): Promise<Message> {
		// First verify the chat belongs to the user
		const chat = await this.getChatById(chatId, userId);
		if (!chat) {
			throw new Error("Chat not found or access denied");
		}

		const newMessage: NewMessage = {
			id: nanoid(),
			chatId,
			...messageData,
		};

		await db.insert(messages).values(newMessage);

		// Update chat's updatedAt timestamp
		await db
			.update(chats)
			.set({ updatedAt: new Date() })
			.where(eq(chats.id, chatId));

		return newMessage as Message;
	}

	static async getChatWithProvider(chatId: string, userId: string): Promise<(Chat & { llmProvider?: LLMProvider }) | null> {
		const result = await db
			.select({
				chat: chats,
				llmProvider: llmProviders,
			})
			.from(chats)
			.leftJoin(llmProviders, eq(chats.llmProviderId, llmProviders.id))
			.where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
			.limit(1);

		if (result.length === 0) {
			return null;
		}

		return {
			...result[0].chat,
			llmProvider: result[0].llmProvider || undefined,
		};
	}
}