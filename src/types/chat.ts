import type { UIMessage as AISdkUIMessage, LanguageModelUsage } from "ai";

export enum MessageRole {
	USER = "user",
	ASSISTANT = "assistant",
	SYSTEM = "system",
	// TOOL = "tool",
}

export type TokenCosts = {
	inputUSD?: number;
	outputUSD?: number;
	totalUSD?: number;
	reasoningUSD?: number;
	cacheReadUSD?: number;
	cacheWriteUSD?: number;
	inputTokenUSD?: number;
	outputTokenUSD?: number;
	reasoningTokenUSD?: number;
	cacheReadsUSD?: number;
	cacheWritesUSD?: number;
};

export enum MessageStatus {
	PENDING = "pending",
	IN_PROGRESS = "in_progress",
	COMPLETE = "complete",
	CANCELLED = "cancelled",
	ERROR = "error",
}

export interface MessageMetadata {
	modelId: string | null;
	totalUsage: LanguageModelUsage | null;
	// timeToFirstToken?: number;
	cost: TokenCosts | null;
	status: MessageStatus | null;
	messageTokens: number;
}

// Create a typed UIMessage
export type UIMessage = AISdkUIMessage<MessageMetadata>;
