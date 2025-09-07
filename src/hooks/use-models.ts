import { useSuspenseQuery } from "@tanstack/react-query";
import { parseModelsData } from "../types/models";

export const useModels = () => {
	const { data } = useSuspenseQuery({
		queryKey: ["models"],
		queryFn: async () => {
			const modelsData = await import("../assets/models.json").then(
				(mod) => mod.default,
			);
			const data = parseModelsData(modelsData);
			if (!data.success) {
				throw data.error;
			}
			return data.data;
		},
		staleTime: Number.POSITIVE_INFINITY,
	});
	return {
		...data,
	};
};
