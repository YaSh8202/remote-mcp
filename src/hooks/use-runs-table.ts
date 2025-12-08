import { z } from "zod/v4";
import { McpRunStatus } from "@/db/schema";
import { baseTableSearchSchema, useGenericTable } from "./use-generic-table";

// Runs-specific search schema
export const runsSearchSchema = baseTableSearchSchema.extend({
	status: z.array(z.nativeEnum(McpRunStatus)).default([]),
	server: z.array(z.string()).default([]),
	app: z.array(z.string()).default([]),
});

export type RunsSearchParams = z.infer<typeof runsSearchSchema>;

export function useRunsTable() {
	return useGenericTable({
		searchSchema: runsSearchSchema,
		defaultPageSize: 10,
		debounceMs: 300,
		filterMapping: {
			status: "status",
			server: "server",
			app: "app",
		},
	});
}
