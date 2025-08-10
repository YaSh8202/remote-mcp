import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { generateId } from "@/lib/id";
import * as Sentry from "@sentry/tanstackstart-react";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../init";

const updateUserSettingsSchema = z.object({
	enableLogging: z.boolean().optional(),
	autoRetry: z.boolean().optional(),
});

export const userSettingsRouter = {
	get: protectedProcedure.query(async ({ ctx }) => {
		return Sentry.startSpan({ name: "Getting user settings" }, async () => {
			try {
				const settings = await db.query.userSettings.findFirst({
					where: eq(userSettings.userId, ctx.user.id),
				});

				// Create default settings if they don't exist
				if (!settings) {
					const newSettings = {
						id: generateId(),
						userId: ctx.user.id,
						enableLogging: true,
						autoRetry: true,
					};

					const [created] = await db
						.insert(userSettings)
						.values(newSettings)
						.returning();
					
					return created;
				}

				return settings;
			} catch (error) {
				Sentry.captureException(error, {
					tags: {
						userId: ctx.user.id,
					},
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to get user settings: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		});
	}),

	update: protectedProcedure
		.input(updateUserSettingsSchema)
		.mutation(async ({ ctx, input }) => {
			return Sentry.startSpan({ name: "Updating user settings" }, async () => {
				try {
					// First check if settings exist
					const existingSettings = await db.query.userSettings.findFirst({
						where: eq(userSettings.userId, ctx.user.id),
					});

					if (!existingSettings) {
						// Create new settings if they don't exist
						const newSettings = {
							id: generateId(),
							userId: ctx.user.id,
							enableLogging: input.enableLogging ?? true,
							autoRetry: input.autoRetry ?? true,
						};

						const [created] = await db
							.insert(userSettings)
							.values(newSettings)
							.returning();

						return created;
					}
					
					// Update existing settings
					const [updated] = await db
						.update(userSettings)
						.set({
							...input,
							updatedAt: new Date(),
						})
						.where(eq(userSettings.userId, ctx.user.id))
						.returning();

					return updated;
				} catch (error) {
					Sentry.captureException(error, {
						tags: {
							userId: ctx.user.id,
						},
					});
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `Failed to update user settings: ${error instanceof Error ? error.message : "Unknown error"}`,
					});
				}
			});
		}),
} satisfies TRPCRouterRecord;
