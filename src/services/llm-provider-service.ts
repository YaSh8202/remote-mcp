import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as crypto from "crypto";

import { db } from "@/db";
import {
	llmProviders,
	type LLMProvider,
	type NewLLMProvider,
	type EncryptedObject,
	LLMProviderType,
} from "@/db/schema";

export class LLMProviderService {
	private static getEncryptionKey(): string {
		const key = process.env.ENCRYPTION_KEY;
		if (!key) {
			throw new Error("ENCRYPTION_KEY environment variable is required");
		}
		return key;
	}

	private static encryptApiKey(apiKey: string): EncryptedObject {
		const secret = this.getEncryptionKey();
		// Generate random salt (16 bytes)
		const salt = crypto.randomBytes(16);
		// PBKDF2 derives a key from secret and salt
		const key = crypto.pbkdf2Sync(secret, salt, 100_000, 32, 'sha256'); // 100k rounds
		const iv = crypto.randomBytes(12); // AES-GCM standard IV size
		const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
		const encrypted = Buffer.concat([
			cipher.update(apiKey, 'utf8'),
			cipher.final()
		]);
		const tag = cipher.getAuthTag();
		return {
			iv: iv.toString('hex'),
			data: encrypted.toString('hex'),
			salt: salt.toString('hex'),
			tag: tag.toString('hex'),
		} as EncryptedObject;
	}

	private static decryptApiKey(encryptedData: EncryptedObject): string {
		const secret = this.getEncryptionKey();
		const salt = Buffer.from(encryptedData.salt, 'hex');
		const key = crypto.pbkdf2Sync(secret, salt, 100_000, 32, 'sha256');
		const iv = Buffer.from(encryptedData.iv, 'hex');
		const encrypted = Buffer.from(encryptedData.data, 'hex');
		const tag = Buffer.from(encryptedData.tag, 'hex');
		const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(tag);
		const decrypted = Buffer.concat([
			decipher.update(encrypted),
			decipher.final()
		]);
		return decrypted.toString('utf8');
	}

	static async createProvider(
		userId: string,
		providerType: LLMProviderType,
		displayName: string,
		apiKey: string,
		config?: Record<string, any>
	): Promise<LLMProvider> {
		const encryptedApiKey = this.encryptApiKey(apiKey);

		const newProvider: NewLLMProvider = {
			id: nanoid(),
			userId,
			providerType,
			displayName,
			apiKey: encryptedApiKey,
			config: config || {},
		};

		await db.insert(llmProviders).values(newProvider);
		return newProvider as LLMProvider;
	}

	static async getUserProviders(userId: string): Promise<LLMProvider[]> {
		return await db
			.select()
			.from(llmProviders)
			.where(and(eq(llmProviders.userId, userId), eq(llmProviders.isActive, true)));
	}

	static async getProviderById(providerId: string, userId: string): Promise<LLMProvider | null> {
		const result = await db
			.select()
			.from(llmProviders)
			.where(and(eq(llmProviders.id, providerId), eq(llmProviders.userId, userId)))
			.limit(1);

		return result[0] || null;
	}

	static async getDecryptedApiKey(providerId: string, userId: string): Promise<string | null> {
		const provider = await this.getProviderById(providerId, userId);
		if (!provider) {
			return null;
		}

		try {
			return this.decryptApiKey(provider.apiKey);
		} catch (error) {
			console.error("Failed to decrypt API key:", error);
			return null;
		}
	}

	static async updateProvider(
		providerId: string,
		userId: string,
		updates: Partial<Omit<LLMProvider, "id" | "userId" | "createdAt" | "apiKey">> & { apiKey?: string }
	): Promise<void> {
		const updateData: any = { ...updates, updatedAt: new Date() };

		// If updating API key, encrypt it
		if (updates.apiKey) {
			updateData.apiKey = this.encryptApiKey(updates.apiKey);
		}

		await db
			.update(llmProviders)
			.set(updateData)
			.where(and(eq(llmProviders.id, providerId), eq(llmProviders.userId, userId)));
	}

	static async deleteProvider(providerId: string, userId: string): Promise<void> {
		await db
			.delete(llmProviders)
			.where(and(eq(llmProviders.id, providerId), eq(llmProviders.userId, userId)));
	}

	static async deactivateProvider(providerId: string, userId: string): Promise<void> {
		await db
			.update(llmProviders)
			.set({ isActive: false, updatedAt: new Date() })
			.where(and(eq(llmProviders.id, providerId), eq(llmProviders.userId, userId)));
	}

	static async getProvidersByType(userId: string, providerType: LLMProviderType): Promise<LLMProvider[]> {
		return await db
			.select()
			.from(llmProviders)
			.where(
				and(
					eq(llmProviders.userId, userId),
					eq(llmProviders.providerType, providerType),
					eq(llmProviders.isActive, true)
				)
			);
	}
}