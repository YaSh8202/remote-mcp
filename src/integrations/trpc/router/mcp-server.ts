import { db } from "@/db";
import { mcpServer } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import type { TRPCRouterRecord } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../init";

const findMcpServer = async (id: string, userId: string) => {
	return await db.query.mcpServer.findFirst({
		where: (mcpServer, { eq, and }) =>
			and(eq(mcpServer.id, id), eq(mcpServer.ownerId, userId)),
		with: {
			apps: true,
		},
	});
};

export const mcpServerRouter = {
	list: protectedProcedure.query(async ({ ctx }) => {
		return await db.query.mcpServer.findMany({
			where: (mcpServer, { eq }) => eq(mcpServer.ownerId, ctx.user.id),
			orderBy: (mcpServer, { desc }) => [desc(mcpServer.createdAt)],
			with: {
				apps: true,
			},
		});
	}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const server = await findMcpServer(input.id, ctx.user.id);

			if (!server) {
				throw null;
			}

			return server;
		}),

	findOrThrow: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const server = await findMcpServer(input.id, ctx.user.id);

			if (!server) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "MCP server not found",
				});
			}

			return server;
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const serverName = input.name?.trim() || "Untitled Server";
			const token = crypto.randomUUID();
			const newServer = await db
				.insert(mcpServer)
				.values({
					id: crypto.randomUUID(),
					name: serverName,
					token: token,
					ownerId: ctx.user.id,
				})
				.returning();

			return newServer[0];
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1, "Name is required").optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// First check if the server exists and belongs to the user
			const existingServer = await db.query.mcpServer.findFirst({
				where: (mcpServer, { eq, and }) =>
					and(eq(mcpServer.id, input.id), eq(mcpServer.ownerId, ctx.user.id)),
			});

			if (!existingServer) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "MCP server not found",
				});
			}

			const updatedServer = await db
				.update(mcpServer)
				.set({
					...(input.name && { name: input.name }),
					updatedAt: new Date(),
				})
				.where(eq(mcpServer.id, input.id))
				.returning();

			return updatedServer[0];
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// First check if the server exists and belongs to the user
			const existingServer = await db.query.mcpServer.findFirst({
				where: (mcpServer, { eq, and }) =>
					and(eq(mcpServer.id, input.id), eq(mcpServer.ownerId, ctx.user.id)),
			});

			if (!existingServer) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "MCP server not found",
				});
			}

			await db.delete(mcpServer).where(eq(mcpServer.id, input.id));

			return { success: true };
		}),

	count: protectedProcedure.query(async ({ ctx }) => {
		const serverCount = await db
			.select({ count: count() })
			.from(mcpServer)
			.where(eq(mcpServer.ownerId, ctx.user.id));

		return serverCount[0]?.count || 0;
	}),
} satisfies TRPCRouterRecord;
