import type {
	LLMProvider,
	ModelsData,
	ModelWithProvider,
} from "../types/models";

/**
 * Utility functions for working with AI models data
 */

/**
 * Get models filtered by provider
 */
export function getModelsByProvider(
	modelsData: ModelsData,
	providerId: LLMProvider,
): ModelWithProvider[] {
	return modelsData.allModels.filter((model) => model.provider === providerId);
}

/**
 * Find a model by its full ID (e.g., "openai:gpt-4")
 */
export function findModelById(
	modelsData: ModelsData,
	modelId: string,
): ModelWithProvider | undefined {
	return modelsData.allModels.find((model) => model.fullId === modelId);
}

/**
 * Get provider information by ID
 */
export function getProviderById(
	modelsData: ModelsData,
	providerId: LLMProvider,
) {
	return modelsData.providers.find((provider) => provider.id === providerId);
}

/**
 * Get all available providers
 */
export function getAllProviders(modelsData: ModelsData) {
	return modelsData.providers;
}

/**
 * Search models by name or model ID
 */
export function searchModels(
	modelsData: ModelsData,
	query: string,
): ModelWithProvider[] {
	const lowerQuery = query.toLowerCase();

	return modelsData.allModels.filter(
		(model) =>
			model.name.toLowerCase().includes(lowerQuery) ||
			model.id.toLowerCase().includes(lowerQuery),
	);
}
