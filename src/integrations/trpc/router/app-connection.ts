import { MCPAppAuthType } from "@/app/mcp/mcp-app/auth";
import { db } from "@/db";
import { getOAuthAppSecrets } from "@/env";
import * as Sentry from "@sentry/tanstackstart-react";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../init";

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
				value: z.object({
					code: z.string().min(1, "Code is required"),
					code_challenge: z.string().min(1, "Code challenge is required"),
					scope: z.string().min(1, "Scope is required"),
					props: z.record(z.string(), z.any()).optional(),
					type: z.literal(MCPAppAuthType.enum.OAUTH2),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const type = input.value.type;

			if (type !== MCPAppAuthType.enum.OAUTH2) {
				throw new Error("Unsupported app connection type");
			}

			const secrets = getOAuthAppSecrets();
			const secret = secrets[input.appName];
			if (!secret) {
				throw new Error(`No secrets found for app: ${input.appName}`);
			}
		}),
} satisfies TRPCRouterRecord;
