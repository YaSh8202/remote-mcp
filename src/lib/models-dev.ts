/**
 * Client for fetching AI model data from models.dev API
 * https://github.com/sst/models.dev
 */

import type {
	ModelWithProvider,
	ModelsData,
	ModelsDevResponse,
} from "@/types/models";
import { LLMProvider } from "@/types/models";

const MODELS_DEV_API_URL = "https://models.dev/api.json";
const CACHE_KEY = "models-dev-data";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_MODELS_PER_PROVIDER = 7; // Show only latest 7 models per provider

interface CachedData {
	data: ModelsDevResponse;
	timestamp: number;
}

/**
 * Get cached models data from sessionStorage
 */
function getCachedData(): ModelsDevResponse | null {
	if (typeof window === "undefined") return null;

	try {
		const cached = sessionStorage.getItem(CACHE_KEY);
		if (!cached) return null;

		const { data, timestamp } = JSON.parse(cached) as CachedData;
		const isExpired = Date.now() - timestamp > CACHE_DURATION;

		if (isExpired) {
			sessionStorage.removeItem(CACHE_KEY);
			return null;
		}

		return data;
	} catch {
		return null;
	}
}

/**
 * Cache models data in sessionStorage
 */
function setCachedData(data: ModelsDevResponse): void {
	if (typeof window === "undefined") return;

	try {
		const cached: CachedData = {
			data,
			timestamp: Date.now(),
		};
		sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
	} catch {
		// Silently fail if sessionStorage is not available
	}
}

/**
 * Fetch models data from models.dev API
 */
export async function fetchModelsDevData(): Promise<ModelsDevResponse> {
	// Check cache first
	const cached = getCachedData();
	if (cached) {
		return cached;
	}

	// Fetch from API
	const response = await fetch(MODELS_DEV_API_URL);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch models data: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as ModelsDevResponse;

	// Cache the data
	setCachedData(data);

	return data;
}

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
		const dateA = new Date(a.release_date).getTime();
		const dateB = new Date(b.release_date).getTime();
		return dateB - dateA; // Newest first
	});
}

/**
 * Process models.dev data into our format
 * - Sorts models by release date
 * - Limits to latest 5 models per provider
 */
export function processModelsDevData(
	modelsDevData: ModelsDevResponse,
): ModelsData {
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
		const providerModels: ModelWithProvider[] = Object.entries(
			providerData.models,
		).map(([modelId, modelData]) => ({
			...modelData,
			provider: providerId,
			providerName: providerData.name,
			fullId: `${providerId}:${modelId}`,
		}));

		// Sort by release date and take latest 5
		const sortedModels = sortModelsByDate(providerModels);
		const latestModels = sortedModels.slice(0, MAX_MODELS_PER_PROVIDER);

		providers.push({
			id: providerId,
			name: providerData.name,
			models: latestModels,
		});

		allModels.push(...latestModels);
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
	const modelsDevData = await fetchModelsDevData();
	return processModelsDevData(modelsDevData);
}
