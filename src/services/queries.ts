import { getUserSession } from "@/lib/auth-server";
import { queryOptions } from "@tanstack/react-query";
import { mcpServerGetOneOrThrow } from "./mcp-server";

export const authQueries = {
	all: ["auth"],
	user: () =>
		queryOptions({
			queryKey: [...authQueries.all, "user"],
			queryFn: () => getUserSession(),
			staleTime: 5000,
		}),
};

export const mcpServerQueries = {
	all: ["mcpServer"],
	getOne: (id: string) =>
		queryOptions({
			queryKey: [...mcpServerQueries.all, id],
			queryFn: () => mcpServerGetOneOrThrow({ data: { id } }),
		}),
};
