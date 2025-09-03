import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, createTRPCRouter } from "../init";
import { ChatService } from "@/services/chat-service";
import { LLMProviderService } from "@/services/llm-provider-service";
import { LLMProviderType } from "@/db/schema";

export const chatRouter = createTRPCRouter({
	// Get all user chats
	getUserChats: protectedProcedure.query(async ({ ctx }) => {
		return await ChatService.getUserChats(ctx.user.id);
	}),

	// Get chat by ID
	getChatById: protectedProcedure
		.input(z.object({ chatId: z.string() }))
		.query(async ({ ctx, input }) => {
			const chat = await ChatService.getChatWithProvider(input.chatId, ctx.user.id);
			if (!chat) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found",
				});
			}
			return chat;
		}),

	// Create new chat
	createChat: protectedProcedure
		.input(
			z.object({
				title: z.string().optional(),
				systemPrompt: z.string().optional(),
				llmProviderId: z.string().optional(),
				mcpServerIds: z.array(z.string()).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			return await ChatService.createChat(ctx.user.id, input);
		}),

	// Update chat
	updateChat: protectedProcedure
		.input(
			z.object({
				chatId: z.string(),
				title: z.string().optional(),
				systemPrompt: z.string().optional(),
				llmProviderId: z.string().optional(),
				mcpServerIds: z.array(z.string()).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { chatId, ...updates } = input;
			await ChatService.updateChat(chatId, ctx.user.id, updates);
		}),

	// Archive chat
	archiveChat: protectedProcedure
		.input(z.object({ chatId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ChatService.archiveChat(input.chatId, ctx.user.id);
		}),

	// Delete chat
	deleteChat: protectedProcedure
		.input(z.object({ chatId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ChatService.deleteChat(input.chatId, ctx.user.id);
		}),

	// Get chat messages
	getChatMessages: protectedProcedure
		.input(z.object({ chatId: z.string() }))
		.query(async ({ ctx, input }) => {
			return await ChatService.getChatMessages(input.chatId, ctx.user.id);
		}),
});

export const llmProviderRouter = createTRPCRouter({
	// Get all user LLM providers
	getUserProviders: protectedProcedure.query(async ({ ctx }) => {
		return await LLMProviderService.getUserProviders(ctx.user.id);
	}),

	// Get provider by ID
	getProviderById: protectedProcedure
		.input(z.object({ providerId: z.string() }))
		.query(async ({ ctx, input }) => {
			const provider = await LLMProviderService.getProviderById(input.providerId, ctx.user.id);
			if (!provider) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Provider not found",
				});
			}
			return provider;
		}),

	// Create new LLM provider
	createProvider: protectedProcedure
		.input(
			z.object({
				providerType: z.nativeEnum(LLMProviderType),
				displayName: z.string().min(1),
				apiKey: z.string().min(1),
				config: z.record(z.any()).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			return await LLMProviderService.createProvider(
				ctx.user.id,
				input.providerType,
				input.displayName,
				input.apiKey,
				input.config
			);
		}),

	// Update LLM provider
	updateProvider: protectedProcedure
		.input(
			z.object({
				providerId: z.string(),
				displayName: z.string().optional(),
				apiKey: z.string().optional(),
				config: z.record(z.any()).optional(),
				isActive: z.boolean().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { providerId, ...updates } = input;
			await LLMProviderService.updateProvider(providerId, ctx.user.id, updates);
		}),

	// Delete LLM provider
	deleteProvider: protectedProcedure
		.input(z.object({ providerId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await LLMProviderService.deleteProvider(input.providerId, ctx.user.id);
		}),

	// Get providers by type
	getProvidersByType: protectedProcedure
		.input(z.object({ providerType: z.nativeEnum(LLMProviderType) }))
		.query(async ({ ctx, input }) => {
			return await LLMProviderService.getProvidersByType(ctx.user.id, input.providerType);
		}),
});