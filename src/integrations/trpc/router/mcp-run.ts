import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { McpRunStatus } from "@/db/schema";
import { mcpRunService } from "@/services/mcp-run-service";
import { createTRPCRouter, protectedProcedure } from "../init";

export const mcpRunRouter = createTRPCRouter({
	// Get runs with pagination and filtering (updated for UI compatibility)
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
				search: z.string().optional(),
				status: z.array(z.nativeEnum(McpRunStatus)).default([]),
				server: z.array(z.string()).default([]),
				app: z.array(z.string()).default([]),
				sort: z
					.array(
						z.object({
							id: z.string(),
							desc: z.boolean(),
						}),
					)
					.default([{ id: "createdAt", desc: true }]),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { page, limit, search, status, server, app, sort } = input;
			const offset = (page - 1) * limit;

			// Convert arrays to parameters for the service layer
			const filters = {
				search,
				status: status.length > 0 ? status : undefined, // Pass array or undefined
				serverIds: server.length > 0 ? server : undefined, // Use serverIds for arrays
				appNames: app.length > 0 ? app : undefined, // Use appNames for arrays
				sortBy:
					(sort[0]?.id as "createdAt" | "toolName" | "status") || "createdAt",
				sortOrder: (sort[0]?.desc ? "desc" : "asc") as "asc" | "desc",
			};

			try {
				const runs = await mcpRunService.getRunsPaginated({
					offset,
					limit,
					ownerId: ctx.user.id,
					...filters,
				});
				return runs;
			} catch (error) {
				console.error("Error fetching runs:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch runs",
				});
			}
		}),

	// Get runs with pagination and filtering (legacy method)
	getRuns: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
				serverId: z.string().optional(),
				appName: z.string().optional(),
				toolName: z.string().optional(),
				status: z.nativeEnum(McpRunStatus).optional(),
				search: z.string().optional(),
				sortBy: z
					.enum(["createdAt", "toolName", "status"])
					.default("createdAt"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { page, limit, ...filters } = input;
			const offset = (page - 1) * limit;

			const runs = await mcpRunService.getRunsPaginated({
				offset,
				limit,
				ownerId: ctx.user.id,
				...filters,
			});

			return runs;
		}),

	// Get a single run by ID
	getRun: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const run = await mcpRunService.getRunById(input.id, ctx.user.id);
			return run;
		}),

	// Get runs for a specific server
	getRunsForServer: protectedProcedure
		.input(
			z.object({
				serverId: z.string(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { page, limit, serverId } = input;
			const offset = (page - 1) * limit;

			const runs = await mcpRunService.getRunsForServerPaginated({
				serverId,
				offset,
				limit,
				ownerId: ctx.user.id,
			});

			return runs;
		}),

	// Get run statistics
	getRunStats: protectedProcedure
		.input(
			z.object({
				serverId: z.string().optional(),
				timeRange: z.enum(["24h", "7d", "30d", "90d"]).default("7d"),
			}),
		)
		.query(async ({ input, ctx }) => {
			const stats = await mcpRunService.getRunStats({
				ownerId: ctx.user.id,
				...input,
			});

			return stats;
		}),

	// Get count of runs for a specific server
	count: protectedProcedure
		.input(
			z.object({
				serverId: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const count = await mcpRunService.getRunsCount({
				serverId: input.serverId,
				ownerId: ctx.user.id,
			});

			return count;
		}),
});
