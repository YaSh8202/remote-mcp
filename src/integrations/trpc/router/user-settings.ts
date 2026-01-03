import * as Sentry from "@sentry/tanstackstart-react";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";
import { userSettingsService } from "@/services/user-settings-service";
import { protectedProcedure } from "../init";

const updateUserSettingsSchema = z.object({
	enableLogging: z.boolean().optional(),
	autoRetry: z.boolean().optional(),
});

export const userSettingsRouter = {
	get: protectedProcedure.query(async ({ ctx }) => {
		return Sentry.startSpan({ name: "Getting user settings" }, async () => {
			try {
				return await userSettingsService.getUserSettings(ctx.user.id);
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
					// Check if settings exist, if not create them first
					const settingsExist = await userSettingsService.userSettingsExist(
						ctx.user.id,
					);

					if (!settingsExist) {
						// Create new settings if they don't exist
						return await userSettingsService.createUserSettings({
							userId: ctx.user.id,
							enableLogging: input.enableLogging ?? true,
							autoRetry: input.autoRetry ?? true,
						});
					}

					// Update existing settings
					return await userSettingsService.updateUserSettings(
						ctx.user.id,
						input,
					);
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
