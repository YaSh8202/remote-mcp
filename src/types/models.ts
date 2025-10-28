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

export const LLMProviderSchema = z.nativeEnum(LLMProvider);

// ============================================================================
// Models.dev API Types - Using directly as our data model
// ============================================================================

/**
 * Types for models.dev API response structure
 * https://github.com/sst/models.dev
 */

export interface ModelsDevModel {
	id: string;
	name: string;
	attachment: boolean;
	reasoning: boolean;
	temperature: boolean;
	tool_call: boolean;
	knowledge?: string;
	release_date: string;
	last_updated: string;
	modalities: {
		input: string[];
		output: string[];
	};
	open_weights: boolean;
	cost: {
		input: number;
		output: number;
		cache_read?: number;
		cache_write?: number;
		reasoning?: number;
		input_audio?: number;
		output_audio?: number;
	};
	limit: {
		context: number;
		output: number;
	};
	status?: string;
}

export interface ModelsDevProvider {
	id: string;
	env: string[];
	npm: string;
	api?: string;
	name: string;
	doc: string;
	models: Record<string, ModelsDevModel>;
}

export type ModelsDevResponse = Record<string, ModelsDevProvider>;

/**
 * Extended model with provider info for easier access
 */
export interface ModelWithProvider extends ModelsDevModel {
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
