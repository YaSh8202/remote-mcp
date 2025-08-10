import { db } from "@/db";
import {
	type NewUserSettings,
	type UserSettings,
	userSettings,
} from "@/db/schema";
import { generateId } from "@/lib/id";
import { eq } from "drizzle-orm";

export interface CreateUserSettingsInput {
	userId: string;
	enableLogging?: boolean;
	autoRetry?: boolean;
}

export interface UpdateUserSettingsInput {
	enableLogging?: boolean;
	autoRetry?: boolean;
}

export class UserSettingsService {
	/**
	 * Get user settings by user ID
	 * Creates default settings if they don't exist
	 */
	async getUserSettings(userId: string): Promise<UserSettings> {
		const settings = await db.query.userSettings.findFirst({
			where: eq(userSettings.userId, userId),
		});

		// Create default settings if they don't exist
		if (!settings) {
			return this.createUserSettings({
				userId,
				enableLogging: true,
				autoRetry: true,
			});
		}

		return settings;
	}

	/**
	 * Create new user settings
	 */
	async createUserSettings(
		input: CreateUserSettingsInput,
	): Promise<UserSettings> {
		const newSettings: NewUserSettings = {
			id: generateId(),
			userId: input.userId,
			enableLogging: input.enableLogging ?? true,
			autoRetry: input.autoRetry ?? true,
		};

		const [created] = await db
			.insert(userSettings)
			.values(newSettings)
			.returning();

		return created;
	}

	/**
	 * Update existing user settings
	 */
	async updateUserSettings(
		userId: string,
		input: UpdateUserSettingsInput,
	): Promise<UserSettings> {
		const [updated] = await db
			.update(userSettings)
			.set({
				...input,
				updatedAt: new Date(),
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		return updated;
	}

	/**
	 * Get or create user settings (convenience method)
	 */
	async getOrCreateUserSettings(userId: string): Promise<UserSettings> {
		const existingSettings = await db.query.userSettings.findFirst({
			where: eq(userSettings.userId, userId),
		});

		if (!existingSettings) {
			return this.createUserSettings({ userId });
		}

		return existingSettings;
	}

	/**
	 * Check if user settings exist
	 */
	async userSettingsExist(userId: string): Promise<boolean> {
		const settings = await db.query.userSettings.findFirst({
			where: eq(userSettings.userId, userId),
		});

		return !!settings;
	}
}

// Export a singleton instance
export const userSettingsService = new UserSettingsService();
