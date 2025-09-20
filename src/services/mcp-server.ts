import { db } from "@/db";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import { userRequiredMiddleware } from "./auth.api";

export const mcpServerGetOneOrThrow = createServerFn({ method: "GET" })
	.validator(z.object({ id: z.string() }))
	.middleware([userRequiredMiddleware])
	.handler(async ({ data, context: { userSession } }) => {
		const server = await db.query.mcpServer.findFirst({
			where: (mcpServer, { eq, and }) =>
				and(
					eq(mcpServer.id, data.id),
					eq(mcpServer.ownerId, userSession.user.id),
				),
			with: {
				apps: true,
			},
		});
		if (!server) throw new Error("MCP server not found");
		return server;
	});
