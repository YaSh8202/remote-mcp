import type { LLMProvider, Model, ModelsData, Provider } from "../types/models";
import { parseModelsData } from "../types/models";

/**
 * Utility functions for working with AI models data
 */

/**
 * Load and validate models data from a JSON file or object
 */
export async function loadModelsData(data: unknown): Promise<ModelsData> {
	const result = parseModelsData(data);

	if (!result.success) {
		throw new Error(`Invalid models data: ${result.error.message}`);
	}

	return result.data;
}

/**
 * Get models filtered by provider
 */
export function getModelsByProvider(
	modelsData: ModelsData,
	providerId: string,
): Model[] {
	return modelsData.models.filter(
		(model) => model.meta.provider === providerId,
	);
}

/**
 * Get models filtered by family (e.g., "gpt-4o", "claude", "gemini")
 */
export function getModelsByFamily(
	modelsData: ModelsData,
	family: string,
): Model[] {
	return modelsData.models.filter((model) => model.meta.family === family);
}

/**
 * Get models that have specific capabilities
 */
export function getModelsByCapability(
	modelsData: ModelsData,
	capability: string,
): Model[] {
	return modelsData.models.filter((model) =>
		model.capabilities.tasks.includes(capability),
	);
}

/**
 * Get models that support specific modalities
 */
export function getModelsByModality(
	modelsData: ModelsData,
	inputModality: string,
): Model[] {
	return modelsData.models.filter((model) =>
		model.capabilities.modalities.input.includes(inputModality),
	);
}

/**
 * Get models with vision capabilities
 */
export function getVisionModels(modelsData: ModelsData): Model[] {
	return modelsData.models.filter(
		(model) =>
			model.meta.tags.includes("vision") ||
			model.capabilities.modalities.input.includes("image"),
	);
}

/**
 * Get free models (models with no cost)
 */
export function getFreeModels(modelsData: ModelsData): Model[] {
	return modelsData.models.filter(
		(model) =>
			model.meta.tags.includes("free") ||
			(model.pricing.inputPerMTokUSD === 0 &&
				model.pricing.outputPerMTokUSD === 0 &&
				model.pricing.perRequestUSD === 0),
	);
}

/**
 * Sort models by price (input tokens)
 */
export function sortModelsByPrice(
	models: Model[],
	direction: "asc" | "desc" = "asc",
): Model[] {
	return [...models].sort((a, b) => {
		const priceA = a.pricing.inputPerMTokUSD;
		const priceB = b.pricing.inputPerMTokUSD;
		return direction === "asc" ? priceA - priceB : priceB - priceA;
	});
}

/**
 * Sort models by context window size
 */
export function sortModelsByContextWindow(
	models: Model[],
	direction: "asc" | "desc" = "desc",
): Model[] {
	return [...models].sort((a, b) => {
		const contextA = a.limits.contextWindow;
		const contextB = b.limits.contextWindow;
		return direction === "asc" ? contextA - contextB : contextB - contextA;
	});
}

/**
 * Find a model by its ID
 */
export function findModelById(
	modelsData: ModelsData,
	modelId: string,
): Model | undefined {
	return modelsData.models.find((model) => model.meta.id === modelId);
}

/**
 * Get provider information by ID
 */
export function getProviderById(
	modelsData: ModelsData,
	providerId: LLMProvider,
): Provider {
	return (
		modelsData.providers.find((provider) => provider.id === providerId) ??
		modelsData.providers[0]
	);
}

/**
 * Get all available providers
 */
export function getAllProviders(modelsData: ModelsData): Provider[] {
	return modelsData.providers;
}

/**
 * Search models by name, description, or tags
 */
export function searchModels(modelsData: ModelsData, query: string): Model[] {
	const lowerQuery = query.toLowerCase();

	return modelsData.models.filter(
		(model) =>
			model.meta.name.toLowerCase().includes(lowerQuery) ||
			model.meta.displayName.toLowerCase().includes(lowerQuery) ||
			model.meta.description.toLowerCase().includes(lowerQuery) ||
			model.meta.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
	);
}

/**
 * Get model statistics
 */
export function getModelStats(modelsData: ModelsData) {
	const models = modelsData.models;

	const providerCounts = models.reduce(
		(acc, model) => {
			acc[model.meta.provider] = (acc[model.meta.provider] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	const avgPrice = {
		input:
			models.reduce((sum, model) => sum + model.pricing.inputPerMTokUSD, 0) /
			models.length,
		output:
			models.reduce((sum, model) => sum + model.pricing.outputPerMTokUSD, 0) /
			models.length,
	};

	const avgContextWindow =
		models.reduce((sum, model) => sum + model.limits.contextWindow, 0) /
		models.length;

	return {
		totalModels: models.length,
		totalProviders: modelsData.providers.length,
		providerCounts,
		avgPrice,
		avgContextWindow,
		visionModelsCount: getVisionModels(modelsData).length,
		freeModelsCount: getFreeModels(modelsData).length,
	};
}
