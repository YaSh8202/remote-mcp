import { mcpApps } from "@/app/mcp/apps";
import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../init";

export const mcpAppRouter = {
	getAvailableApps: publicProcedure.query(async () => {
		return mcpApps
			.map((appDefinition) => appDefinition.metadata())
			.sort((a, b) => a.name.localeCompare(b.name));
	}),
	listServerApps: protectedProcedure
		.input(
			z.object({
				serverId: z.string().min(1, "Server ID is required"),
			}),
		)
		.query(async ({ ctx, input }) => {
			// check server ownership
			const userServer = await db.query.mcpServer.findFirst({
				where: (mcpServer, { eq, and }) =>
					and(
						eq(mcpServer.id, input.serverId),
						eq(mcpServer.ownerId, ctx.user.id),
					),
			});
			if (!userServer) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "MCP server not found or you do not own it",
				});
			}

			const installedApps = await db.query.mcpApps.findMany({
				where: (mcpApps, { eq }) => eq(mcpApps.serverId, input.serverId),
				orderBy: (mcpApps, { desc }) => [desc(mcpApps.createdAt)],
			});

			return installedApps.map((installedApp) => ({
				...installedApp,
				metadata:
					mcpApps.find(
						(appDefinition) => appDefinition.name === installedApp.appName,
					)?.metadata || undefined,
			}));
		}),
} satisfies TRPCRouterRecord;
