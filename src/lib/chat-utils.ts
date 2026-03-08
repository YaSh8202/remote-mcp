import {
	type UIMessage as AISDKUIMessage,
	createIdGenerator,
	isReasoningUIPart,
	isTextUIPart,
	isToolUIPart,
} from "ai";
import { countTokens } from "gpt-tokenizer";
import type { Message } from "@/db/schema";
import type { ToolDescription } from "@/services/mcp-server";
import { type MessageRole, MessageStatus, type UIMessage } from "@/types/chat";

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
		role: dbMessage.role,
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to schema flexibility
		parts: dbMessage.content as any,
		metadata: {
			...(dbMessage.metadata || {}),
			parentId: dbMessage.parentId ?? null,
		} as UIMessage["metadata"],
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
	// Prefer explicit parentId parameter, then metadata.parentId, then null
	const resolvedParentId =
		parentId !== undefined ? parentId : (uiMessage.metadata?.parentId ?? null);
	return {
		id: uiMessage.id || generateMessageId(),
		chatId,
		role: uiMessage.role as MessageRole,
		// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to schema flexibility
		content: uiMessage.parts as any,
		status: uiMessage.metadata?.status || MessageStatus.COMPLETE,
		parentId: resolvedParentId,
		branchIndex: "0",
		metadata: uiMessage.metadata || null,
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
 * Creates a basic text message part
 */
export function createTextMessagePart(text: string) {
	return {
		type: "text",
		text,
	};
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

export function stringifyUIMessage(message: AISDKUIMessage): string {
	let text = "";

	for (const part of message.parts) {
		if (isReasoningUIPart(part) || isTextUIPart(part)) {
			text += `${part.text}\n`;
			continue;
		}
		if (isToolUIPart(part)) {
			text += part.title;

			if ("toolName" in part && part.toolName) {
				text += ` [${part.toolName}]\n`;
			}

			if (part.input) {
				text += JSON.stringify(part.input);
				text += "\n";
			}

			if (part.output) {
				text += JSON.stringify(part.output);
				text += "\n";
			}
			text += " ";
		}
	}

	return text;
}

export function countUIMessageTokens(message: AISDKUIMessage): number {
	const text = stringifyUIMessage(message);

	const count = countTokens(text);

	// console.log("Token count for message:", text, "is", count);

	return count;
}

export function countToolTokens(tool: ToolDescription): number {
	const content = `${tool.name} ${tool.description ?? ""} ${tool.inputSchema ? JSON.stringify(tool.inputSchema) : ""}`;
	return countTokens(content);
}
