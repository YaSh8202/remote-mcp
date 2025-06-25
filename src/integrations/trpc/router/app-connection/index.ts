import { MCPAppAuthType } from "@/app/mcp/mcp-app/auth";
import { db } from "@/db";
import { AppConnectionType } from "@/db/schema";
import { appConnectionService } from "@/services/app-connection-service";
import * as Sentry from "@sentry/tanstackstart-react";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
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
} satisfies TRPCRouterRecord;
