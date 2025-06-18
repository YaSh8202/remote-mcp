import { mcpApps } from "@/app/mcp/apps";
import { db } from "@/db";
import { mcpApps as mcpAppsTable } from "@/db/schema";
import * as Sentry from "@sentry/tanstackstart-react";
import { TRPCError } from "@trpc/server";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../init";

export const mcpAppRouter = {
	getAvailableApps: publicProcedure.query(async () => {
		return Sentry.startSpan({ name: "Getting available MCP apps" }, async () => {
			return mcpApps
				.map((appDefinition) => appDefinition.metadata())
				.sort((a, b) => a.name.localeCompare(b.name));
		});
	}),
	listServerApps: protectedProcedure
		.input(
			z.object({
				serverId: z.string().min(1, "Server ID is required"),
			}),
		)
		.query(async ({ ctx, input }) => {
			return Sentry.startSpan({ name: "Listing server apps" }, async () => {
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
			});
		}),
	installApp: protectedProcedure
		.input(
			z.object({
				serverId: z.string().min(1, "Server ID is required"),
				appName: z.string().min(1, "App name is required"),
				tools: z.array(z.string()).min(1, "At least one tool must be selected"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return Sentry.startSpan({ name: "Installing MCP app" }, async () => {
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

				// Check if app is already installed
				const existingApp = await db.query.mcpApps.findFirst({
					where: (mcpApps, { eq, and }) =>
						and(
							eq(mcpApps.serverId, input.serverId),
							eq(mcpApps.appName, input.appName),
						),
				});

				if (existingApp) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "App is already installed on this server",
					});
				}

				// Validate app exists in available apps
				const appDefinition = mcpApps.find((app) => app.name === input.appName);
				if (!appDefinition) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "App definition not found",
					});
				}

				// Validate tools exist in app
				const availableTools = appDefinition.tools.map((tool) => tool.name);
				const invalidTools = input.tools.filter(
					(tool) => !availableTools.includes(tool),
				);
				if (invalidTools.length > 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid tools: ${invalidTools.join(", ")}`,
					});
				}

				// Create app installation
				const [newApp] = await db
					.insert(mcpAppsTable)
					.values({
						id: crypto.randomUUID(),
						serverId: input.serverId,
						appName: input.appName,
						tools: input.tools,
					})
					.returning();

				return newApp;
			});
		}),
} satisfies TRPCRouterRecord;
