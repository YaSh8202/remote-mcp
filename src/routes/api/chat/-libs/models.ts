import {
	type AnthropicProviderOptions,
	createAnthropic,
} from "@ai-sdk/anthropic";
import {
	createGoogleGenerativeAI,
	type GoogleGenerativeAIProviderOptions,
} from "@ai-sdk/google";
import { createGroq, type GroqProviderOptions } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import {
	createOpenAI,
	type OpenAIResponsesProviderOptions,
} from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LLMProvider } from "@/types/models";

export function getAIModel(
	provider: LLMProvider,
	model: string | undefined,
	apiKey: string,
) {
	switch (provider) {
		case LLMProvider.OPENAI:
			return createOpenAI({
				apiKey: apiKey,
			})(model || "gpt-4o-mini");

		case LLMProvider.ANTHROPIC:
			return createAnthropic({
				apiKey: apiKey,
			})(model || "claude-3-5-sonnet-20241022");

		case LLMProvider.GOOGLE:
			return createGoogleGenerativeAI({
				apiKey: apiKey,
			})(model || "gemini-2.0-flash-exp");

		case LLMProvider.MISTRAL:
			return createMistral({
				apiKey: apiKey,
			})(model || "mistral-small-latest");

		case LLMProvider.GROQ:
			// Groq is OpenAI-compatible, use createOpenAI with Groq's base URL
			return createGroq({
				apiKey: apiKey,
				// baseURL: "https://api.groq.com/openai/v1",
			})(model || "llama-3.3-70b-versatile");

		case LLMProvider.ALIBABA:
			// Alibaba Cloud (Qwen) uses OpenAI-compatible API
			return createOpenAICompatible({
				apiKey: apiKey,
				baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
				name: "alibaba",
			})(model || "qwen3-max");

		case LLMProvider.GITHUB_MODELS:
			// GitHub Models uses OpenAI-compatible API
			return createOpenAICompatible({
				apiKey: apiKey,
				baseURL: "https://models.github.ai/inference",
				name: "github-models",
			})(model || "gpt-4.1-mini");

		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

export const getProviderOptions = () => {
	return {
		openai: {
			reasoningEffort: "medium",
			reasoningSummary: "auto",
			textVerbosity: "medium",
		} satisfies OpenAIResponsesProviderOptions,
		anthropic: {
			thinking: { type: "enabled", budgetTokens: 12000 },
			sendReasoning: true,
		} satisfies AnthropicProviderOptions,
		google: {
			thinkingConfig: {
				includeThoughts: true,
			},
		} satisfies GoogleGenerativeAIProviderOptions,
		grok: {
			reasoningEffort: "medium",
		} satisfies GroqProviderOptions,
	};
};
