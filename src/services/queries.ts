import { queryOptions } from "@tanstack/react-query";
import { getUserSession } from "@/lib/auth-server";

export const authQueries = {
	all: ["auth"],
	user: () =>
		queryOptions({
			queryKey: [...authQueries.all, "user"],
			queryFn: () => getUserSession(),
			staleTime: 5000,
		}),
};
