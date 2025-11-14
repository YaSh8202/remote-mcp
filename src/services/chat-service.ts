import { generateId, type UIMessage } from "ai";
import { and, desc, eq, gt, or } from "drizzle-orm";
import { db } from "@/db";
import { type Chat, chats, messages } from "@/db/schema";
import { dbMessagesToUIMessages, uiMessageToDbMessage } from "@/lib/chat-utils";

/**
 * Creates a new chat for the given user
 */
export async function createChat(
	userId: string,
	title?: string,
): Promise<string> {
	const chatId = generateId();

	await db.insert(chats).values({
		id: chatId,
		title: title,
		ownerId: userId,
		metadata: {},
	});

	return chatId;
}

/**
 * Loads chat messages from database
 */
export async function loadChat(
	chatId: string,
	userId: string,
): Promise<{
	chat: Chat;
	messages: UIMessage[];
}> {
	// First verify chat ownership
	const chat = await db
		.select()
		.from(chats)
		.where(and(eq(chats.id, chatId), eq(chats.ownerId, userId)))
		.limit(1);

	if (!chat[0]) {
		throw new Error("Chat not found or access denied");
	}

	// Load ALL messages for this chat including branches
	const chatMessages = await db
		.select()
		.from(messages)
		.where(eq(messages.chatId, chatId))
		.orderBy(messages.createdAt);

	return {
		chat: chat[0],
		messages: dbMessagesToUIMessages(chatMessages),
	};
}

/**
 * Saves chat messages to database
 */
export async function saveChat({
	chatId,
	userId,
	messages: uiMessages,
}: {
	chatId: string;
	userId: string;
	messages: UIMessage[];
}): Promise<void> {
	// Verify chat ownership
	const chat = await db
		.select()
		.from(chats)
		.where(and(eq(chats.id, chatId), eq(chats.ownerId, userId)))
		.limit(1);

	if (!chat[0]) {
		throw new Error("Chat not found or access denied");
	}

	// Get existing messages
	const existingMessages = await db
		.select()
		.from(messages)
		.where(eq(messages.chatId, chatId));

	const existingIds = new Set(existingMessages.map((m) => m.id));

	// Insert new messages only
	const newMessages = uiMessages.filter((msg) => !existingIds.has(msg.id));

	if (newMessages.length > 0) {
		const dbMessages = newMessages.map((msg) =>
			uiMessageToDbMessage(msg, chatId),
		);

		await db.insert(messages).values(dbMessages);
	}

	// Update chat title if not set and we have user messages
	if (!chat[0].title && uiMessages.length > 0) {
		const firstUserMessage = uiMessages.find((msg) => msg.role === "user");
		let title = "New Chat";

		if (firstUserMessage?.parts && firstUserMessage.parts.length > 0) {
			// Find first text part
			const textPart = firstUserMessage.parts.find(
				(part) => part.type === "text",
			);
			if (textPart && "text" in textPart) {
				title =
					textPart.text.slice(0, 50) + (textPart.text.length > 50 ? "..." : "");
			}
		}

		await db
			.update(chats)
			.set({ title, updatedAt: new Date(), lastMessagedAt: new Date() })
			.where(eq(chats.id, chatId));
	} else {
		// Just update the updatedAt and lastMessagedAt timestamp when new messages are added
		if (newMessages.length > 0) {
			await db
				.update(chats)
				.set({ updatedAt: new Date(), lastMessagedAt: new Date() })
				.where(eq(chats.id, chatId));
		}
	}
}

/**
 * Gets all chats for a user
 */
export async function getUserChats(
	userId: string,
	options: {
		archived?: boolean;
		limit?: number;
		offset?: number;
	} = {},
): Promise<
	Array<{
		id: string;
		title: string | null;
		updatedAt: Date;
		lastMessagedAt: Date;
		archived: boolean;
	}>
> {
	const { archived = false, limit = 50, offset = 0 } = options;

	const where = and(eq(chats.ownerId, userId), eq(chats.archived, archived));

	return await db
		.select({
			id: chats.id,
			title: chats.title,
			updatedAt: chats.updatedAt,
			lastMessagedAt: chats.lastMessagedAt,
			archived: chats.archived,
		})
		.from(chats)
		.where(where)
		.orderBy(desc(chats.lastMessagedAt))
		.limit(limit)
		.offset(offset);
}

/**
 * Deletes a chat and all its messages
 */
export async function deleteChat(
	chatId: string,
	userId: string,
): Promise<void> {
	// Verify ownership
	const chat = await db
		.select()
		.from(chats)
		.where(and(eq(chats.id, chatId), eq(chats.ownerId, userId)))
		.limit(1);

	if (!chat[0]) {
		throw new Error("Chat not found or access denied");
	}

	// Delete chat (messages will be cascade deleted)
	await db.delete(chats).where(eq(chats.id, chatId));
}

/**
 * Archives/unarchives a chat
 */
export async function archiveChat(
	chatId: string,
	userId: string,
	archived: boolean,
): Promise<void> {
	// Verify ownership
	const chat = await db
		.select()
		.from(chats)
		.where(and(eq(chats.id, chatId), eq(chats.ownerId, userId)))
		.limit(1);

	if (!chat[0]) {
		throw new Error("Chat not found or access denied");
	}

	await db
		.update(chats)
		.set({ archived, updatedAt: new Date() })
		.where(eq(chats.id, chatId));
}

/**
 * Updates chat title
 */
export async function updateChatTitle(
	chatId: string,
	userId: string,
	title: string,
): Promise<void> {
	// Verify ownership
	const chat = await db
		.select()
		.from(chats)
		.where(and(eq(chats.id, chatId), eq(chats.ownerId, userId)))
		.limit(1);

	if (!chat[0]) {
		throw new Error("Chat not found or access denied");
	}

	await db
		.update(chats)
		.set({ title, updatedAt: new Date() })
		.where(eq(chats.id, chatId));
}

/**
 * Deletes a specific message and all messages that come after it (used for regeneration)
 * This is used when regenerating an assistant's response - it deletes the old response
 * and any subsequent messages, keeping all messages before it for context
 */
export async function deleteMessageAndAfter(
	chatId: string,
	messageId: string,
	userId: string,
): Promise<void> {
	// Verify chat ownership
	const chat = await db
		.select()
		.from(chats)
		.where(and(eq(chats.id, chatId), eq(chats.ownerId, userId)))
		.limit(1);

	if (!chat[0]) {
		throw new Error("Chat not found or access denied");
	}

	// Get the message to find its timestamp
	const targetMessage = await db
		.select()
		.from(messages)
		.where(and(eq(messages.id, messageId), eq(messages.chatId, chatId)))
		.limit(1);

	if (!targetMessage[0]) {
		throw new Error("Message not found");
	}

	// Delete the target message AND all messages created after it (based on timestamp)
	// This includes the message itself and anything that came after
	await db
		.delete(messages)
		.where(
			and(
				eq(messages.chatId, chatId),
				or(
					gt(messages.createdAt, targetMessage[0].createdAt),
					eq(messages.id, messageId),
				),
			),
		);
}
