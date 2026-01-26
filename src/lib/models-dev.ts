import type { ProviderInfo } from "@tokenlens/core";
import { fetchModels } from "tokenlens";
import type { ModelsData, ModelWithProvider } from "@/types/models";
import { LLMProvider } from "@/types/models";

/**
 * Provider ID mapping between our LLMProvider enum and models.dev IDs
 */
const PROVIDER_ID_MAP: Record<LLMProvider, string> = {
	[LLMProvider.OPENAI]: "openai",
	[LLMProvider.ANTHROPIC]: "anthropic",
	[LLMProvider.GOOGLE]: "google",
	[LLMProvider.ALIBABA]: "alibaba",
	[LLMProvider.GROQ]: "groq",
	[LLMProvider.GITHUB_MODELS]: "github-models",
	[LLMProvider.MISTRAL]: "mistral",
};

/**
 * Sort models by release date (newest first)
 */
function sortModelsByDate(models: ModelWithProvider[]): ModelWithProvider[] {
	return models.sort((a, b) => {
		const dateA = new Date(a.release_date ?? 0).getTime();
		const dateB = new Date(b.release_date ?? 0).getTime();
		return dateB - dateA; // Newest first
	});
}

/**
 * Process models.dev data into our format
 * - Sorts models by release date
 * - Limits to latest 5 models per provider
 */
export function processModelsDevData(modelsDevData: {
	[key: string]: ProviderInfo;
}): ModelsData {
	const providers: ModelsData["providers"] = [];
	const allModels: ModelWithProvider[] = [];

	for (const providerId of Object.values(LLMProvider)) {
		const modelsDevId = PROVIDER_ID_MAP[providerId];
		const providerData = modelsDevData[modelsDevId];

		if (!providerData) {
			// Skip providers not found in models.dev
			continue;
		}

		// Convert provider models to ModelWithProvider format
		const providerModels = Object.entries(providerData.models).map(
			([modelId, modelData]) => ({
				...modelData,
				provider: providerId,
				providerName: providerData.name,
				fullId: `${providerId}:${modelId}`,
			}),
		) as ModelWithProvider[];

		// Sort by release date and take latest 5
		const sortedModels = sortModelsByDate(Object.values(providerModels));

		providers.push({
			id: providerId,
			name: providerData.name || providerData.id,
			models: sortedModels.filter((m) => !m.id.includes("embedding")),
		});

		allModels.push(...sortedModels);
	}

	return {
		providers,
		allModels: sortModelsByDate(allModels),
	};
}

/**
 * Fetch and process models data from models.dev
 */
export async function getModelsData(): Promise<ModelsData> {
	const modelsDevData = await fetchModels();
	return processModelsDevData(modelsDevData);
}
