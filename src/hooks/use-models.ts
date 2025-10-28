import { getModelsData } from "@/lib/models-dev";
import { useSuspenseQuery } from "@tanstack/react-query";

export const useModels = () => {
	const { data } = useSuspenseQuery({
		queryKey: ["models"],
		queryFn: async () => {
			return await getModelsData();
		},
		staleTime: 24 * 60 * 60 * 1000, // 24 hours - models data doesn't change frequently
		gcTime: 24 * 60 * 60 * 1000, // 24 hours
	});
	return {
		...data,
	};
};
