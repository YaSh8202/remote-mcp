import { TRPCError } from "@trpc/server";
import { generateId } from "ai";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { MessageRole, MessageStatus, chats, messages } from "@/db/schema";
import { saveChat } from "@/services/chat-service";
import type { UIMessage } from "ai";
import { createTRPCRouter, protectedProcedure } from "../init";

// Zod schemas for input validation
const createChatSchema = z.object({
	title: z.string().optional(),
	metadata: z.record(z.unknown()).optional(),
	messages: z.array(z.custom<UIMessage>(() => true)),
});

const updateChatSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	archived: z.boolean().optional(),
	metadata: z.record(z.unknown()).optional(),
});

const messagePartSchema = z.object({
	type: z.string(),
	text: z.string().optional(),
	// Tool call parts
	toolCallId: z.string().optional(),
	toolName: z.string().optional(),
	input: z.record(z.unknown()).optional(),
	output: z.record(z.unknown()).optional(),
	result: z.record(z.unknown()).optional(),
	isError: z.boolean().optional(),
	// File/image parts
	data: z.string().optional(),
	url: z.string().optional(),
	mediaType: z.string().optional(),
	filename: z.string().optional(),
	// Reasoning parts
	reasoning: z.string().optional(),
});

const createMessageSchema = z.object({
	chatId: z.string(),
	role: z.nativeEnum(MessageRole),
	content: z.array(messagePartSchema),
	status: z.nativeEnum(MessageStatus).optional(),
	parentId: z.string().optional(),
	branchIndex: z.string().optional(),
	tokenUsage: z
		.object({
			promptTokens: z.number().optional(),
			completionTokens: z.number().optional(),
			totalTokens: z.number().optional(),
		})
		.optional(),
	metadata: z.record(z.unknown()).optional(),
});

const updateMessageSchema = z.object({
	id: z.string(),
	content: z.array(messagePartSchema).optional(),
	status: z.nativeEnum(MessageStatus).optional(),
	tokenUsage: z
		.object({
			promptTokens: z.number().optional(),
			completionTokens: z.number().optional(),
			totalTokens: z.number().optional(),
		})
		.optional(),
	metadata: z.record(z.unknown()).optional(),
});

export const chatRouter = createTRPCRouter({
	// Get all chats for the authenticated user
	list: protectedProcedure
		.input(
			z.object({
				archived: z.boolean().optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where = and(
				eq(chats.ownerId, ctx.user.id),
				input.archived !== undefined
					? eq(chats.archived, input.archived)
					: undefined,
			);

			return await db
				.select()
				.from(chats)
				.where(where)
				.orderBy(desc(chats.lastMessagedAt))
				.limit(input.limit)
				.offset(input.offset);
		}),

	// Get a specific chat by ID
	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const chat = await db
				.select()
				.from(chats)
				.where(and(eq(chats.id, input.id), eq(chats.ownerId, ctx.user.id)))
				.limit(1);

			if (!chat[0]) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found",
				});
			}

			return chat[0];
		}),

	// Create a new chat
	create: protectedProcedure
		.input(createChatSchema)
		.mutation(async ({ ctx, input }) => {
			const chatId = generateId();

			const newChat = await db
				.insert(chats)
				.values({
					id: chatId,
					title: input.title,
					ownerId: ctx.user.id,
					metadata: input.metadata || {},
				})
				.returning();

			const messages = input.messages as UIMessage[] | undefined;

			if (messages && messages?.length > 0) {
				const chat = newChat[0];

				await saveChat({
					chatId: chat.id,
					messages: messages,
					userId: ctx.user.id,
				});
			}

			return newChat[0];
		}),

	// Update a chat
	update: protectedProcedure
		.input(updateChatSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;

			// Verify ownership
			const existingChat = await db
				.select()
				.from(chats)
				.where(and(eq(chats.id, id), eq(chats.ownerId, ctx.user.id)))
				.limit(1);

			if (!existingChat[0]) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found",
				});
			}

			const updatedChat = await db
				.update(chats)
				.set({
					...updateData,
					updatedAt: new Date(),
				})
				.where(eq(chats.id, id))
				.returning();

			return updatedChat[0];
		}),

	// Delete a chat
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Verify ownership
			const existingChat = await db
				.select()
				.from(chats)
				.where(and(eq(chats.id, input.id), eq(chats.ownerId, ctx.user.id)))
				.limit(1);

			if (!existingChat[0]) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found",
				});
			}

			await db.delete(chats).where(eq(chats.id, input.id));

			return { success: true };
		}),

	// Get messages for a specific chat
	getMessages: protectedProcedure
		.input(
			z.object({
				chatId: z.string(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
				parentId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Verify chat ownership first
			const chat = await db
				.select()
				.from(chats)
				.where(and(eq(chats.id, input.chatId), eq(chats.ownerId, ctx.user.id)))
				.limit(1);

			if (!chat[0]) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found",
				});
			}

			const where = and(
				eq(messages.chatId, input.chatId),
				input.parentId
					? eq(messages.parentId, input.parentId)
					: isNull(messages.parentId),
			);

			return await db
				.select()
				.from(messages)
				.where(where)
				.orderBy(messages.createdAt)
				.limit(input.limit)
				.offset(input.offset);
		}),

	// Create a new message
	createMessage: protectedProcedure
		.input(createMessageSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify chat ownership
			const chat = await db
				.select()
				.from(chats)
				.where(and(eq(chats.id, input.chatId), eq(chats.ownerId, ctx.user.id)))
				.limit(1);

			if (!chat[0]) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found",
				});
			}

			const messageId = generateId();

			const newMessage = await db
				.insert(messages)
				.values({
					id: messageId,
					chatId: input.chatId,
					role: input.role,
					content: input.content,
					status: input.status || MessageStatus.COMPLETE,
					parentId: input.parentId,
					branchIndex: input.branchIndex || "0",
					tokenUsage: input.tokenUsage,
					metadata: input.metadata || {},
				})
				.returning();

			// Update chat's updatedAt and lastMessagedAt timestamp
			await db
				.update(chats)
				.set({
					updatedAt: new Date(),
					lastMessagedAt: new Date(),
				})
				.where(eq(chats.id, input.chatId));

			return newMessage[0];
		}),

	// Update a message
	updateMessage: protectedProcedure
		.input(updateMessageSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;

			// Verify message exists and chat ownership
			const messageWithChat = await db
				.select({
					message: messages,
					chat: chats,
				})
				.from(messages)
				.leftJoin(chats, eq(messages.chatId, chats.id))
				.where(eq(messages.id, id))
				.limit(1);

			if (
				!messageWithChat[0] ||
				messageWithChat[0].chat?.ownerId !== ctx.user.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			}

			const updatedMessage = await db
				.update(messages)
				.set({
					...updateData,
					updatedAt: new Date(),
				})
				.where(eq(messages.id, id))
				.returning();

			return updatedMessage[0];
		}),

	// Delete a message
	deleteMessage: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Verify message exists and chat ownership
			const messageWithChat = await db
				.select({
					message: messages,
					chat: chats,
				})
				.from(messages)
				.leftJoin(chats, eq(messages.chatId, chats.id))
				.where(eq(messages.id, input.id))
				.limit(1);

			if (
				!messageWithChat[0] ||
				messageWithChat[0].chat?.ownerId !== ctx.user.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			}

			await db.delete(messages).where(eq(messages.id, input.id));

			return { success: true };
		}),

	// Get chat with its messages (convenience method)
	getWithMessages: protectedProcedure
		.input(
			z.object({
				chatId: z.string(),
				messageLimit: z.number().min(1).max(100).default(50),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Get chat
			const chat = await db
				.select()
				.from(chats)
				.where(and(eq(chats.id, input.chatId), eq(chats.ownerId, ctx.user.id)))
				.limit(1);

			if (!chat[0]) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found",
				});
			}

			// Get messages
			const chatMessages = await db
				.select()
				.from(messages)
				.where(
					and(
						eq(messages.chatId, input.chatId),
						isNull(messages.parentId), // Only get root messages for now
					),
				)
				.orderBy(messages.createdAt)
				.limit(input.messageLimit);

			return {
				chat: chat[0],
				messages: chatMessages,
			};
		}),
});
