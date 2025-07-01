import { MCPAppAuthType } from "@/app/mcp/mcp-app/auth";
import { db } from "@/db";
import { AppConnectionType, appConnections, mcpApps } from "@/db/schema";
import { appConnectionService } from "@/services/app-connection-service";
import * as Sentry from "@sentry/tanstackstart-react";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../init";

export const appConnectionRouter = {
	listConnections: protectedProcedure
		.input(
			z.object({
				appName: z.string().min(1, "App name is required"),
			}),
		)
		.query(async ({ ctx, input }) => {
			return Sentry.startSpan({ name: "Listing app connections" }, async () => {
				const connections = await db.query.appConnections.findMany({
					where: (appConnections, { eq, and }) =>
						and(
							eq(appConnections.ownerId, ctx.user.id),
							eq(appConnections.appName, input.appName),
						),
					orderBy: (appConnections, { desc }) => [
						desc(appConnections.createdAt),
					],
				});

				return connections;
			});
		}),
	getAllConnections: protectedProcedure.query(async ({ ctx }) => {
		return Sentry.startSpan(
			{ name: "Getting all user connections" },
			async () => {
				const connections = await db.query.appConnections.findMany({
					where: (appConnections, { eq }) =>
						eq(appConnections.ownerId, ctx.user.id),
					orderBy: (appConnections, { desc }) => [
						desc(appConnections.createdAt),
					],
				});

				return connections;
			},
		);
	}),
	// Get all connections with usage count in MCP servers
	getAllConnectionsWithUsage: protectedProcedure.query(async ({ ctx }) => {
		return Sentry.startSpan(
			{ name: "Getting all user connections with usage count" },
			async () => {
				// Get connections with usage count
				const connectionsWithUsage = await db
					.select({
						id: appConnections.id,
						displayName: appConnections.displayName,
						appName: appConnections.appName,
						type: appConnections.type,
						status: appConnections.status,
						createdAt: appConnections.createdAt,
						updatedAt: appConnections.updatedAt,
						usageCount: sql<number>`COUNT(${mcpApps.id})::int`,
					})
					.from(appConnections)
					.leftJoin(mcpApps, sql`${appConnections.id} = ${mcpApps.connectionId}`)
					.where(sql`${appConnections.ownerId} = ${ctx.user.id}`)
					.groupBy(
						appConnections.id,
						appConnections.displayName,
						appConnections.appName,
						appConnections.type,
						appConnections.status,
						appConnections.createdAt,
						appConnections.updatedAt
					)
					.orderBy(sql`${appConnections.createdAt} DESC`);

				return connectionsWithUsage;
			},
		);
	}),
	create: protectedProcedure
		.input(
			z.object({
				appName: z.string().min(1, "App name is required"),
				displayName: z.string().min(1, "Display name is required"),
				type: z.nativeEnum(AppConnectionType),
				value: z.object({
					code: z.string().min(1, "Code is required"),
					code_challenge: z
						.string()
						.min(1, "Code challenge is required")
						.optional(),
					scope: z.string().min(1, "Scope is required").optional(),
					props: z.record(z.string(), z.any()).optional(),
					type: z.literal(MCPAppAuthType.enum.OAUTH2),
					redirect_url: z.string().min(1, "Redirect URL is required"),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const type = input.type;

			try {
				const savedConnection = await appConnectionService.upsert({
					appName: input.appName,
					ownerId: ctx.user.id,
					displayName: input.displayName,
					type: type,
					value: input.value,
				});

				return savedConnection;
			} catch (error) {
				Sentry.captureException(error, {
					tags: {
						appName: input.appName,
						userId: ctx.user.id,
					},
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to create app connection: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),
	
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().min(1, "Connection ID is required"),
				displayName: z.string().min(1, "Display name is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const connection = await db.query.appConnections.findFirst({
					where: (appConnections, { eq, and }) =>
						and(
							eq(appConnections.id, input.id),
							eq(appConnections.ownerId, ctx.user.id),
						),
				});

				if (!connection) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Connection not found",
					});
				}

				const updatedConnection = await db
					.update(appConnections)
					.set({
						displayName: input.displayName,
						updatedAt: new Date(),
					})
					.where(
						sql`${appConnections.id} = ${input.id} AND ${appConnections.ownerId} = ${ctx.user.id}`
					)
					.returning();

				return updatedConnection[0];
			} catch (error) {
				Sentry.captureException(error, {
					tags: {
						connectionId: input.id,
						userId: ctx.user.id,
					},
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to update app connection: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.string().min(1, "Connection ID is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const connection = await db.query.appConnections.findFirst({
					where: (appConnections, { eq, and }) =>
						and(
							eq(appConnections.id, input.id),
							eq(appConnections.ownerId, ctx.user.id),
						),
				});

				if (!connection) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Connection not found",
					});
				}
					
				const deletedConnection = await db
					.delete(appConnections)
					.where(
						sql`${appConnections.id} = ${input.id} AND ${appConnections.ownerId} = ${ctx.user.id}`
					)
					.returning();

				return deletedConnection[0];
			} catch (error) {
				Sentry.captureException(error, {
					tags: {
						connectionId: input.id,
						userId: ctx.user.id,
					},
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to delete app connection: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),
} satisfies TRPCRouterRecord;
