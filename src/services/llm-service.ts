import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";

import { LLMProviderType, type LLMProvider } from "@/db/schema";
import { LLMProviderService } from "./llm-provider-service";

export interface LLMConfig {
	model: string;
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
}

export class LLMService {
	static async streamChat(
		provider: LLMProvider,
		messages: CoreMessage[],
		config: LLMConfig,
		systemPrompt?: string,
		userId?: string
	) {
		const apiKey = await LLMProviderService.getDecryptedApiKey(provider.id, userId!);
		if (!apiKey) {
			throw new Error("Failed to decrypt API key");
		}

		switch (provider.providerType) {
			case LLMProviderType.OPENAI:
				return this.streamOpenAI(apiKey, messages, config, systemPrompt);
			
			case LLMProviderType.CLAUDE:
				return this.streamClaude(apiKey, messages, config, systemPrompt);
			
			case LLMProviderType.GEMINI:
				return this.streamGemini(apiKey, messages, config, systemPrompt);
			
			case LLMProviderType.OPENROUTER:
				return this.streamOpenRouter(apiKey, messages, config, systemPrompt);
			
			default:
				throw new Error(`Unsupported provider type: ${provider.providerType}`);
		}
	}

	private static streamOpenAI(
		apiKey: string,
		messages: CoreMessage[],
		config: LLMConfig,
		systemPrompt?: string
	) {
		const openaiClient = createOpenAI({
			apiKey,
		});

		return streamText({
			model: openaiClient(config.model || "gpt-4o-mini"),
			messages,
			system: systemPrompt,
			temperature: config.temperature || 0.7,
			maxTokens: config.maxTokens,
			topP: config.topP,
			frequencyPenalty: config.frequencyPenalty,
			presencePenalty: config.presencePenalty,
		});
	}

	private static streamClaude(
		apiKey: string,
		messages: CoreMessage[],
		config: LLMConfig,
		systemPrompt?: string
	) {
		// Note: You'll need to install @ai-sdk/anthropic
		// For now, we'll use a placeholder implementation
		throw new Error("Claude integration not yet implemented. Please install @ai-sdk/anthropic");
		
		// const anthropicClient = anthropic({
		// 	apiKey,
		// });

		// return streamText({
		// 	model: anthropicClient(config.model || "claude-3-5-sonnet-20241022"),
		// 	messages,
		// 	system: systemPrompt,
		// 	temperature: config.temperature || 0.7,
		// 	maxTokens: config.maxTokens,
		// });
	}

	private static streamGemini(
		apiKey: string,
		messages: CoreMessage[],
		config: LLMConfig,
		systemPrompt?: string
	) {
		// Note: You'll need to install @ai-sdk/google
		// For now, we'll use a placeholder implementation
		throw new Error("Gemini integration not yet implemented. Please install @ai-sdk/google");
		
		// const googleClient = google({
		// 	apiKey,
		// });

		// return streamText({
		// 	model: googleClient(config.model || "gemini-1.5-pro"),
		// 	messages,
		// 	system: systemPrompt,
		// 	temperature: config.temperature || 0.7,
		// 	maxTokens: config.maxTokens,
		// });
	}

	private static streamOpenRouter(
		apiKey: string,
		messages: CoreMessage[],
		config: LLMConfig,
		systemPrompt?: string
	) {
		const openrouterClient = createOpenAI({
			apiKey,
			baseURL: "https://openrouter.ai/api/v1",
		});

		return streamText({
			model: openrouterClient(config.model || "anthropic/claude-3.5-sonnet"),
			messages,
			system: systemPrompt,
			temperature: config.temperature || 0.7,
			maxTokens: config.maxTokens,
			topP: config.topP,
			frequencyPenalty: config.frequencyPenalty,
			presencePenalty: config.presencePenalty,
		});
	}

	static getDefaultModels(providerType: LLMProviderType): string[] {
		switch (providerType) {
			case LLMProviderType.OPENAI:
				return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
			
			case LLMProviderType.CLAUDE:
				return ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"];
			
			case LLMProviderType.GEMINI:
				return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"];
			
			case LLMProviderType.OPENROUTER:
				return [
					"anthropic/claude-3.5-sonnet",
					"openai/gpt-4o",
					"google/gemini-pro-1.5",
					"meta-llama/llama-3.1-405b-instruct",
				];
			
			default:
				return [];
		}
	}

	static getDefaultConfig(providerType: LLMProviderType): LLMConfig {
		const baseConfig = {
			temperature: 0.7,
			maxTokens: 4096,
		};

		switch (providerType) {
			case LLMProviderType.OPENAI:
				return {
					...baseConfig,
					model: "gpt-4o-mini",
					topP: 1,
					frequencyPenalty: 0,
					presencePenalty: 0,
				};
			
			case LLMProviderType.CLAUDE:
				return {
					...baseConfig,
					model: "claude-3-5-sonnet-20241022",
				};
			
			case LLMProviderType.GEMINI:
				return {
					...baseConfig,
					model: "gemini-1.5-pro",
				};
			
			case LLMProviderType.OPENROUTER:
				return {
					...baseConfig,
					model: "anthropic/claude-3.5-sonnet",
				};
			
			default:
				return baseConfig;
		}
	}
}