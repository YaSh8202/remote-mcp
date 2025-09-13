import type { Chat, Message, MessageRole } from "@/db/schema";
import { MessageStatus } from "@/db/schema";
import type {
	ExternalStoreThreadData,
	ThreadMessageLike,
} from "@assistant-ui/react";
import { type UIMessage, createIdGenerator } from "ai";

export const generateMessageId = createIdGenerator({
	prefix: "msg",
	size: 16,
});

/**
 * Converts a database Message to AI SDK UIMessage format
 */
export function dbMessageToUIMessage(dbMessage: Message): UIMessage {
	return {
		id: dbMessage.id,
		role: dbMessage.role as "user" | "assistant" | "system",
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to schema flexibility
		parts: dbMessage.content as any,
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to schema flexibility
		metadata: dbMessage.metadata as any,
	};
}

/**
 * Converts AI SDK UIMessage to database Message format (for insertion)
 */
export function uiMessageToDbMessage(
	uiMessage: UIMessage,
	chatId: string,
	parentId?: string | null,
): Omit<Message, "createdAt" | "updatedAt"> {
	return {
		id: uiMessage.id || generateMessageId(),
		chatId,
		role: uiMessage.role as MessageRole,
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to schema flexibility
		content: uiMessage.parts as any,
		status: MessageStatus.COMPLETE,
		parentId: parentId || null,
		branchIndex: "0",
		tokenUsage: null,
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to schema flexibility
		metadata: (uiMessage.metadata || {}) as any,
	};
}

/**
 * Converts a database Message to assistant-ui ThreadMessageLike format
 */
export function dbMessageToThreadMessage(
	dbMessage: Message,
): ThreadMessageLike {
	const baseMessage: ThreadMessageLike = {
		id: dbMessage.id,
		role: dbMessage.role as "user" | "assistant" | "system",
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to schema flexibility
		content: dbMessage.content as any,
		createdAt: dbMessage.createdAt,
	};

	// Add status for assistant messages if present
	if (dbMessage.role === "assistant" && dbMessage.status) {
		// biome-ignore lint/suspicious/noExplicitAny: Required for extending readonly type
		(baseMessage as any).status = dbMessage.status;
	}

	// Add metadata if present
	if (dbMessage.metadata && Object.keys(dbMessage.metadata).length > 0) {
		// biome-ignore lint/suspicious/noExplicitAny: Required for extending readonly type
		(baseMessage as any).metadata = dbMessage.metadata;
	}

	return baseMessage;
}

/**
 * Converts assistant-ui ThreadMessageLike to database Message format
 */
export function threadMessageToDbMessage(
	threadMessage: ThreadMessageLike,
	chatId: string,
	parentId?: string | null,
): Omit<Message, "createdAt" | "updatedAt"> {
	return {
		id: threadMessage.id || generateMessageId(),
		chatId,
		role: threadMessage.role as MessageRole,
		content: Array.isArray(threadMessage.content)
			? // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to schema flexibility
				(threadMessage.content as any)
			: [{ type: "text", text: threadMessage.content }],
		// biome-ignore lint/suspicious/noExplicitAny: Optional property access
		status: (threadMessage as any).status || MessageStatus.COMPLETE,
		parentId: parentId || null,
		branchIndex: "0",
		tokenUsage: null,
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to schema flexibility
		metadata: (threadMessage.metadata || {}) as any,
	};
}

/**
 * Generates a chat title from the first user message
 */
export function generateChatTitle(messages: Message[]): string {
	const firstUserMessage = messages.find((m) => m.role === "user");

	if (!firstUserMessage || !firstUserMessage.content.length) {
		return "New Chat";
	}

	// Extract text from the first text part
	const textPart = firstUserMessage.content.find(
		(part) => part.type === "text",
	);
	if (!textPart?.text) {
		return "New Chat";
	}

	// Truncate to a reasonable length
	const title = textPart.text.trim();
	return title.length > 50 ? `${title.substring(0, 47)}...` : title;
}

/**
 * Converts an array of database Messages to AI SDK UIMessage format
 */
export function dbMessagesToUIMessages(dbMessages: Message[]): UIMessage[] {
	return dbMessages.map(dbMessageToUIMessage);
}

/**
 * Converts an array of database Messages to assistant-ui ThreadMessageLike format
 */
export function dbMessagesToThreadMessages(
	dbMessages: Message[],
): ThreadMessageLike[] {
	return dbMessages.map(dbMessageToThreadMessage);
}

/**
 * Creates a basic text message part
 */
export function createTextMessagePart(text: string) {
	return {
		type: "text",
		text,
	};
}

/**
 * Creates a tool call message part
 */
export function createToolCallMessagePart(
	toolCallId: string,
	toolName: string,
	input: Record<string, unknown>,
) {
	return {
		type: "tool-call",
		toolCallId,
		toolName,
		input,
	};
}

/**
 * Creates a tool result message part
 */
export function createToolResultMessagePart(
	toolCallId: string,
	toolName: string,
	result: Record<string, unknown>,
	isError = false,
) {
	return {
		type: "tool-result",
		toolCallId,
		toolName,
		result,
		isError,
	};
}

/**
 * Validates if a message has valid content structure
 */
export function isValidMessageContent(content: unknown): boolean {
	if (!Array.isArray(content)) {
		return false;
	}

	return content.every(
		(part) =>
			typeof part === "object" &&
			part !== null &&
			typeof (part as Record<string, unknown>).type === "string",
	);
}

/**
 * Gets the text content from a message's parts
 */
export function getMessageText(message: Message): string {
	const textParts = message.content.filter((part) => part.type === "text");
	return textParts
		.map((part) => part.text || "")
		.join(" ")
		.trim();
}

/**
 * Checks if a message is from a specific role
 */
export function isMessageFromRole(
	message: Message,
	role: MessageRole,
): boolean {
	return message.role === role;
}

/**
 * Gets the latest message in a chat
 */
export function getLatestMessage(messages: Message[]): Message | null {
	if (messages.length === 0) return null;

	return messages.reduce((latest, current) =>
		current.createdAt > latest.createdAt ? current : latest,
	);
}

/**
 * Filters messages by role
 */
export function filterMessagesByRole(
	messages: Message[],
	role: MessageRole,
): Message[] {
	return messages.filter((message) => message.role === role);
}

export function dbChatToExternalStoreThread(chat: Chat) {
	if (chat.archived) {
		return {
			threadId: chat.id,
			title: chat.title ?? "New Chat",
			status: "archived",
		} as ExternalStoreThreadData<"archived">;
	}
	return {
		threadId: chat.id,
		title: chat.title ?? "New Chat",
		status: "regular",
	} as ExternalStoreThreadData<"regular">;
}
