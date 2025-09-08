import { db } from "@/db";
import { type LLMProviderKey, llmProviderKeys } from "@/db/schema";
import { decryptObject, encryptObject } from "@/lib/encryption";
import { LLMProvider } from "@/types/models";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// API key validation functions
export async function validateOpenAIKey(
	apiKey: string,
): Promise<{ isValid: boolean; models?: string[]; error?: string }> {
	try {
		const response = await fetch("https://api.openai.com/v1/models", {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
		});

		if (response.ok) {
			const data = await response.json();
			const models = data.data?.map((model: { id: string }) => model.id) || [];
			return { isValid: true, models };
		}

		const errorData = await response.json().catch(() => ({}));
		return {
			isValid: false,
			error: errorData.error?.message || `HTTP ${response.status}`,
		};
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : "Network error",
		};
	}
}

export async function validateClaudeKey(
	apiKey: string,
): Promise<{ isValid: boolean; models?: string[]; error?: string }> {
	try {
		// Use a simple message API call to validate the key
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "claude-3-haiku-20240307",
				max_tokens: 1,
				messages: [{ role: "user", content: "test" }],
			}),
		});

		if (response.status === 400) {
			// A 400 with the right headers means the key is valid but the request was malformed
			// which is expected for our validation test
			const errorData = await response.json().catch(() => ({}));
			if (errorData.type === "invalid_request_error") {
				return {
					isValid: true,
					models: [
						"claude-3-opus-20240229",
						"claude-3-sonnet-20240229",
						"claude-3-haiku-20240307",
						"claude-3-5-sonnet-20241022",
					],
				};
			}
		}

		if (response.ok) {
			return {
				isValid: true,
				models: [
					"claude-3-opus-20240229",
					"claude-3-sonnet-20240229",
					"claude-3-haiku-20240307",
					"claude-3-5-sonnet-20241022",
				],
			};
		}

		const errorData = await response.json().catch(() => ({}));
		return {
			isValid: false,
			error: errorData.error?.message || `HTTP ${response.status}`,
		};
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : "Network error",
		};
	}
}

export async function validateGoogleKey(
	apiKey: string,
): Promise<{ isValid: boolean; models?: string[]; error?: string }> {
	try {
		// Use the list models endpoint to validate the key and get available models
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (response.ok) {
			const data = await response.json();
			const models = data.models
				? data.models.map(
						(model: { name: string }) =>
							// Extract model ID from full name (e.g., "models/gemini-pro" -> "gemini-pro")
							model.name.split("/").pop() || model.name,
					)
				: [];
			return { isValid: true, models };
		}

		if (response.status === 400) {
			const errorData = await response.json().catch(() => ({}));
			return {
				isValid: false,
				error: errorData.error?.message || "Invalid API key format",
			};
		}

		if (response.status === 403) {
			return {
				isValid: false,
				error: "API key not authorized or quota exceeded",
			};
		}

		const errorData = await response.json().catch(() => ({}));
		return {
			isValid: false,
			error:
				errorData.error?.message ||
				errorData.message ||
				`HTTP ${response.status}`,
		};
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : "Network error",
		};
	}
}

export async function validateApiKey(provider: LLMProvider, apiKey: string) {
	switch (provider) {
		case LLMProvider.OPENAI:
			return await validateOpenAIKey(apiKey);
		case LLMProvider.ANTHROPIC:
			return await validateClaudeKey(apiKey);
		case LLMProvider.GOOGLE:
			return await validateGoogleKey(apiKey);
		default:
			return { isValid: false, error: "Unsupported provider" };
	}
}

// Database operations
export async function addLLMProviderKey(
	userId: string,
	provider: LLMProvider,
	apiKey: string,
	setAsDefault = true,
): Promise<{ success: boolean; keyId?: string; error?: string }> {
	try {
		// Validate the API key first
		const validation = await validateApiKey(provider, apiKey);
		if (!validation.isValid) {
			return { success: false, error: validation.error };
		}

		// If setting as default, unset other default keys for this provider
		if (setAsDefault) {
			await db
				.update(llmProviderKeys)
				.set({ isDefault: false })
				.where(
					and(
						eq(llmProviderKeys.userId, userId),
						eq(llmProviderKeys.provider, provider),
					),
				);
		}

		// Encrypt the API key
		const encryptedKey = encryptObject(apiKey);

		// Create the new key record
		const keyId = nanoid();
		await db.insert(llmProviderKeys).values({
			id: keyId,
			userId,
			provider,
			encryptedKey,
			isDefault: setAsDefault,
			isValid: true,
			lastValidated: new Date(),
			metadata: {
				models: validation.models || [],
			},
		});

		return { success: true, keyId };
	} catch (error) {
		console.error("Failed to add LLM provider key:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to save API key",
		};
	}
}

export async function getLLMProviderKeys(
	userId: string,
	provider?: LLMProvider,
): Promise<Omit<LLMProviderKey, "encryptedKey">[]> {
	const baseQuery = db
		.select({
			id: llmProviderKeys.id,
			createdAt: llmProviderKeys.createdAt,
			updatedAt: llmProviderKeys.updatedAt,
			userId: llmProviderKeys.userId,
			provider: llmProviderKeys.provider,
			isDefault: llmProviderKeys.isDefault,
			isValid: llmProviderKeys.isValid,
			lastValidated: llmProviderKeys.lastValidated,
			metadata: llmProviderKeys.metadata,
		})
		.from(llmProviderKeys);

	if (provider) {
		return await baseQuery
			.where(
				and(
					eq(llmProviderKeys.userId, userId),
					eq(llmProviderKeys.provider, provider),
				),
			)
			.orderBy(
				desc(llmProviderKeys.isDefault),
				desc(llmProviderKeys.createdAt),
			);
	}

	return await baseQuery
		.where(eq(llmProviderKeys.userId, userId))
		.orderBy(desc(llmProviderKeys.isDefault), desc(llmProviderKeys.createdAt));
}

export async function getDefaultLLMProviderKey(
	userId: string,
	provider: LLMProvider,
): Promise<string | null> {
	try {
		const [key] = await db
			.select()
			.from(llmProviderKeys)
			.where(
				and(
					eq(llmProviderKeys.userId, userId),
					eq(llmProviderKeys.provider, provider),
					eq(llmProviderKeys.isDefault, true),
					eq(llmProviderKeys.isValid, true),
				),
			)
			.limit(1);

		if (!key) {
			return null;
		}

		// Decrypt and return the API key
		return decryptObject<string>(key.encryptedKey);
	} catch (error) {
		console.error("Failed to get default LLM provider key:", error);
		return null;
	}
}

export async function updateLLMProviderKey(
	keyId: string,
	userId: string,
	updates: { isDefault?: boolean },
): Promise<{ success: boolean; error?: string }> {
	try {
		// If setting as default, unset other default keys for this provider first
		if (updates.isDefault) {
			const existingKey = await db
				.select({ provider: llmProviderKeys.provider })
				.from(llmProviderKeys)
				.where(eq(llmProviderKeys.id, keyId))
				.limit(1);

			if (existingKey[0]) {
				await db
					.update(llmProviderKeys)
					.set({ isDefault: false })
					.where(
						and(
							eq(llmProviderKeys.userId, userId),
							eq(llmProviderKeys.provider, existingKey[0].provider),
						),
					);
			}
		}

		await db
			.update(llmProviderKeys)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(
				and(eq(llmProviderKeys.id, keyId), eq(llmProviderKeys.userId, userId)),
			);

		return { success: true };
	} catch (error) {
		console.error("Failed to update LLM provider key:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to update API key",
		};
	}
}

export async function deleteLLMProviderKey(
	keyId: string,
	userId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		await db
			.delete(llmProviderKeys)
			.where(
				and(eq(llmProviderKeys.id, keyId), eq(llmProviderKeys.userId, userId)),
			);

		return { success: true };
	} catch (error) {
		console.error("Failed to delete LLM provider key:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete API key",
		};
	}
}

export async function revalidateLLMProviderKey(
	keyId: string,
	userId: string,
): Promise<{ success: boolean; isValid?: boolean; error?: string }> {
	try {
		const [key] = await db
			.select()
			.from(llmProviderKeys)
			.where(
				and(eq(llmProviderKeys.id, keyId), eq(llmProviderKeys.userId, userId)),
			)
			.limit(1);

		if (!key) {
			return { success: false, error: "API key not found" };
		}

		// Decrypt the API key
		const apiKey = decryptObject<string>(key.encryptedKey);

		// Validate the key
		const validation = await validateApiKey(key.provider, apiKey);

		// Update the validation status
		await db
			.update(llmProviderKeys)
			.set({
				isValid: validation.isValid,
				lastValidated: new Date(),
				metadata: {
					...key.metadata,
					models:
						validation.models ||
						(key.metadata as { models?: string[] })?.models ||
						[],
				},
				updatedAt: new Date(),
			})
			.where(eq(llmProviderKeys.id, keyId));

		return { success: true, isValid: validation.isValid };
	} catch (error) {
		console.error("Failed to revalidate LLM provider key:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to validate API key",
		};
	}
}

export async function hasValidLLMProviderKey(
	userId: string,
	provider?: LLMProvider,
): Promise<boolean> {
	try {
		const baseQuery = db
			.select({ id: llmProviderKeys.id })
			.from(llmProviderKeys);

		let result: { id: string }[];
		if (provider) {
			result = await baseQuery
				.where(
					and(
						eq(llmProviderKeys.userId, userId),
						eq(llmProviderKeys.provider, provider),
						eq(llmProviderKeys.isValid, true),
					),
				)
				.limit(1);
		} else {
			result = await baseQuery
				.where(
					and(
						eq(llmProviderKeys.userId, userId),
						eq(llmProviderKeys.isValid, true),
					),
				)
				.limit(1);
		}

		return result.length > 0;
	} catch (error) {
		console.error("Failed to check for valid LLM provider keys:", error);
		return false;
	}
}
