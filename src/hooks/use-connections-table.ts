import { createFilterSchema, useGenericTable } from "@/hooks/use-generic-table";
import { z } from "zod";

// Define the connection filter schema
export const connectionsFilterSchema = createFilterSchema({
	app: z.string().optional(),
	status: z.enum(["ACTIVE", "MISSING", "ERROR"]).optional(),
	type: z.enum(["OAUTH2", "NO_AUTH"]).optional(),
});

export type ConnectionsSearchParams = z.infer<typeof connectionsFilterSchema>;

export function useConnectionsTable() {
	return useGenericTable({
		searchSchema: connectionsFilterSchema,
		defaultPageSize: 10,
		debounceMs: 300,
		filterMapping: {
			app: "appName",
		},
	});
}
