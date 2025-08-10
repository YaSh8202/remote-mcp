import { db } from "@/db";
import {
	accounts,
	appConnections,
	mcpApps,
	mcpRuns,
	mcpServer,
	sessions,
	userSettings,
	users,
} from "@/db/schema";
import * as Sentry from "@sentry/tanstackstart-react";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure } from "../init";

export const userRouter = {
	deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
		return Sentry.startSpan({ name: "Deleting user account" }, async () => {
			try {
				const userId = ctx.user.id;

				// Delete user data in order (respecting foreign key constraints)

				// 1. Delete MCP runs first (they reference apps and servers)
				await db.delete(mcpRuns).where(eq(mcpRuns.ownerId, userId));

				// 2. Delete MCP apps (they reference servers)
				const userServers = await db.query.mcpServer.findMany({
					where: eq(mcpServer.ownerId, userId),
					columns: { id: true },
				});

				for (const server of userServers) {
					await db.delete(mcpApps).where(eq(mcpApps.serverId, server.id));
				}

				// 3. Delete MCP servers
				await db.delete(mcpServer).where(eq(mcpServer.ownerId, userId));

				// 4. Delete app connections
				await db
					.delete(appConnections)
					.where(eq(appConnections.ownerId, userId));

				// 5. Delete user settings
				await db.delete(userSettings).where(eq(userSettings.userId, userId));

				// 6. Delete user sessions
				await db.delete(sessions).where(eq(sessions.userId, userId));

				// 7. Delete user accounts (OAuth connections)
				await db.delete(accounts).where(eq(accounts.userId, userId));

				// 8. Finally delete the user
				await db.delete(users).where(eq(users.id, userId));

				return { success: true };
			} catch (error) {
				Sentry.captureException(error, {
					tags: {
						userId: ctx.user.id,
					},
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to delete account: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		});
	}),
} satisfies TRPCRouterRecord;
