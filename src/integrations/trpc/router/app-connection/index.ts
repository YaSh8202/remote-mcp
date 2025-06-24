import { mcpApps } from "@/app/mcp/apps";
import { MCPAppAuthType } from "@/app/mcp/mcp-app/auth";
import { db } from "@/db";
import {
	AppConnectionStatus,
	type NewAppConnection,
	appConnections,
} from "@/db/schema";
import { getOAuthAppSecrets } from "@/env";
import { encryptObject } from "@/lib/encryption";
import * as Sentry from "@sentry/tanstackstart-react";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../init";
import { credentialsOauth2Service } from "./credentials-oauth2-service";

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
			const type = input.value.type;

			if (type !== MCPAppAuthType.enum.OAUTH2) {
				throw new Error("Unsupported app connection type");
			}

			const secrets = getOAuthAppSecrets();
			const secret = secrets[input.appName];
			if (!secret) {
				throw new Error(`No secrets found for app: ${input.appName}`);
			}

			const client_id = secret.clientId;
			const client_secret = secret.clientSecret;

			const mcpApp = await mcpApps.find((app) => app.name === input.appName);
			if (!mcpApp) {
				throw new Error(`MCP app not found: ${input.appName}`);
			}

			const tokenUrl = mcpApp.auth?.tokenUrl;
			if (!tokenUrl) {
				throw new Error(`Token URL not found for app: ${input.appName}`);
			}
			try {
				const validatedConnectionValue = await credentialsOauth2Service.claim({
					appName: input.appName,
					request: {
						code: input.value.code,
						codeVerifier: input.value.code_challenge,
						clientId: client_id,
						clientSecret: client_secret,
						tokenUrl,
						scope: input.value.scope,
						authorizationMethod: mcpApp.auth?.authorizationMethod,
						props: input.value.props,
						redirectUrl: input.value.redirect_url,
					},
				});

				const encryptedConnectionValue = encryptObject({
					...validatedConnectionValue,
					...input.value,
				});

				const savedConnection = await db
					.insert(appConnections)
					.values({
						id: crypto.randomUUID(),
						appName: input.appName,
						ownerId: ctx.user.id,
						displayName: input.displayName,
						value: encryptedConnectionValue,
						type: type,
						status: AppConnectionStatus.ACTIVE,
					} as NewAppConnection)
					.returning();

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
