import { getModelsData } from "@/lib/models-dev";
import type { ModelsData } from "@/types/models";
import { useQuery } from "@tanstack/react-query";

// Fallback empty data to prevent crashes when API is unavailable
const FALLBACK_MODELS_DATA: ModelsData = {
	providers: [],
	allModels: [],
};

export const useModels = () => {
	const { data, error, isLoading } = useQuery({
		queryKey: ["models"],
		queryFn: async () => {
			return await getModelsData();
		},
		staleTime: 24 * 60 * 60 * 1000, // 24 hours - models data doesn't change frequently
		gcTime: 24 * 60 * 60 * 1000, // 24 hours
		retry: 2, // Retry twice before giving up
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
	});

	// Log errors for debugging without crashing the page
	if (error) {
		console.error("Failed to load models data:", error);
	}

	return {
		...(data ?? FALLBACK_MODELS_DATA),
		isLoading,
		error,
	};
};
