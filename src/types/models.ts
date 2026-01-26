import type { ProviderInfo, ProviderModel } from "@tokenlens/core";
import { z } from "zod/v4";

export enum LLMProvider {
	OPENAI = "openai",
	ANTHROPIC = "anthropic",
	GOOGLE = "google",
	ALIBABA = "alibaba",
	GROQ = "groq",
	GITHUB_MODELS = "github-models",
	MISTRAL = "mistral",
}

export const supportedLLMProviders = Object.values(LLMProvider);

export const LLMProviderSchema = z.enum(LLMProvider);

// ============================================================================
// Models.dev API Types - Using directly as our data model
// ============================================================================

/**
 * Types for models.dev API response structure
 * https://github.com/sst/models.dev
 */

export type ModelsDevResponse = Record<string, ProviderInfo>;

/**
 * Extended model with provider info for easier access
 */
export interface ModelWithProvider extends ProviderModel {
	provider: LLMProvider;
	providerName: string;
	fullId: string; // provider:modelId format
}

/**
 * Processed models data with providers and models
 */
export interface ModelsData {
	providers: Array<{
		id: LLMProvider;
		name: string;
		models: ModelWithProvider[];
	}>;
	allModels: ModelWithProvider[];
}
