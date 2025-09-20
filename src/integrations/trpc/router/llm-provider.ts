import {
	addLLMProviderKey,
	deleteLLMProviderKey,
	getDefaultLLMProviderKey,
	getLLMProviderKeys,
	hasValidLLMProviderKey,
	revalidateLLMProviderKey,
	updateLLMProviderKey,
	validateApiKey,
} from "@/services/llm-provider-service";
import { LLMProvider } from "@/types/models";
import { z } from "zod/v4";
import { createTRPCRouter, protectedProcedure } from "../init";

export const llmProviderRouter = createTRPCRouter({
	// Get all LLM provider keys for the current user
	getKeys: protectedProcedure
		.input(
			z.object({
				provider: z.nativeEnum(LLMProvider).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await getLLMProviderKeys(ctx.user.id, input.provider);
		}),

	// Add a new LLM provider key
	addKey: protectedProcedure
		.input(
			z.object({
				provider: z.nativeEnum(LLMProvider),
				apiKey: z.string().min(1, "API key is required"),
				setAsDefault: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await addLLMProviderKey(
				ctx.user.id,
				input.provider,
				input.apiKey,
				input.setAsDefault,
			);

			if (!result.success) {
				throw new Error(result.error || "Failed to add API key");
			}

			return { success: true, keyId: result.keyId };
		}),

	// Update an existing LLM provider key
	updateKey: protectedProcedure
		.input(
			z.object({
				keyId: z.string().min(1, "Key ID is required"),
				isDefault: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await updateLLMProviderKey(input.keyId, ctx.user.id, {
				isDefault: input.isDefault,
			});

			if (!result.success) {
				throw new Error(result.error || "Failed to update API key");
			}

			return { success: true };
		}),

	// Delete an LLM provider key
	deleteKey: protectedProcedure
		.input(
			z.object({
				keyId: z.string().min(1, "Key ID is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await deleteLLMProviderKey(input.keyId, ctx.user.id);

			if (!result.success) {
				throw new Error(result.error || "Failed to delete API key");
			}

			return { success: true };
		}),

	// Validate and refresh the status of an API key
	revalidateKey: protectedProcedure
		.input(
			z.object({
				keyId: z.string().min(1, "Key ID is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await revalidateLLMProviderKey(input.keyId, ctx.user.id);

			if (!result.success) {
				throw new Error(result.error || "Failed to validate API key");
			}

			return { success: true, isValid: result.isValid };
		}),

	// Check if user has any valid LLM provider keys
	hasValidKeys: protectedProcedure
		.input(
			z.object({
				provider: z.nativeEnum(LLMProvider).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await hasValidLLMProviderKey(ctx.user.id, input.provider);
		}),

	// Get the default key for a provider (returns only boolean if exists)
	hasDefaultKey: protectedProcedure
		.input(
			z.object({
				provider: z.nativeEnum(LLMProvider),
			}),
		)
		.query(async ({ ctx, input }) => {
			const key = await getDefaultLLMProviderKey(ctx.user.id, input.provider);
			return { hasKey: !!key };
		}),

	// Validate an API key without storing it
	validateKey: protectedProcedure
		.input(
			z.object({
				provider: z.nativeEnum(LLMProvider),
				apiKey: z.string().min(1, "API key is required"),
			}),
		)
		.mutation(async ({ input }) => {
			const result = await validateApiKey(input.provider, input.apiKey);
			return {
				isValid: result.isValid,
				models: result.models,
				error: result.error,
			};
		}),

	// Get available providers
	getProviders: protectedProcedure.query(() => {
		return Object.values(LLMProvider).map((provider) => ({
			id: provider,
			name: provider.charAt(0).toUpperCase() + provider.slice(1),
			description: getProviderDescription(provider),
		}));
	}),
});

function getProviderDescription(provider: LLMProvider): string {
	switch (provider) {
		case LLMProvider.OPENAI:
			return "OpenAI's GPT models including GPT-4, GPT-3.5";
		case LLMProvider.ANTHROPIC:
			return "Anthropic's Claude models including Claude 3 Opus, Sonnet, and Haiku";
		case LLMProvider.GOOGLE:
			return "Google's Gemini models";
		default:
			return "";
	}
}
