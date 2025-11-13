import { db } from "@/db";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import { userRequiredMiddleware } from "./auth.api";

import { env } from "@/env";
import { StreamableHTTPClientTransport } from "@socotra/modelcontextprotocol-sdk/client/streamableHttp.js";
import { experimental_createMCPClient as createMCPClient } from "ai";

export const ChatMcpServer = z.union([
	z.object({
		id: z.string(),
		config: z.object({
			url: z.url(),
			type: z.enum(["http", "sse"]),
			headers: z.record(z.string(), z.unknown()).optional(),
		}),
		displayName: z.string(),
		isRemoteMcp: z.literal(false),
		tools: z.array(z.string()),
		includeAllTools: z.boolean(),
	}),
	z.object({
		id: z.string(),
		isRemoteMcp: z.literal(true),
		mcpServerId: z.string(),
		tools: z.array(z.string()),
		includeAllTools: z.boolean(),
	}),
]);

export type ChatMcpServer = z.infer<typeof ChatMcpServer>;

export type ToolDescription = { name: string; description?: string };

export type ServerToolsList = Array<{
	name: string;
	tools: ToolDescription[];
}>;

export const mcpServerListTools = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			servers: z.array(ChatMcpServer),
		}),
	)
	.middleware([userRequiredMiddleware])
	.handler(async ({ data, context: { userSession } }) => {
		if (data.servers.length === 0) {
			return [] as ServerToolsList;
		}
		const allTools = await Promise.all(
			data.servers.map(async (server) => {
				let url: string;
				let name: string;

				if (server.isRemoteMcp) {
					const remoteMcpServer = await db.query.mcpServer.findFirst({
						where: (mcpServer, { eq, and }) =>
							and(
								eq(mcpServer.id, server.mcpServerId),
								eq(mcpServer.ownerId, userSession.user.id),
							),
					});
					if (!remoteMcpServer) {
						return {
							name: "Unknown",
							tools: [],
						};
					}
					url = `${env.SERVER_URL}/api/mcp/${remoteMcpServer.token}`;
					name = remoteMcpServer.name;
				} else {
					url = server.config.url;
					name = server.displayName;
				}

				const httpTransport = new StreamableHTTPClientTransport(new URL(url), {
					requestInit: {
						headers: server.isRemoteMcp
							? {
									"x-API-Key": env.MCP_SERVER_API_KEY,
									"X-User-Id": userSession.user.id,
								}
							: {
									...((server.config.headers as Record<string, string>) || {}),
								},
					},
				});

				const mcpClient = await createMCPClient({
					transport: httpTransport,
				});

				const tools = await mcpClient.tools();

				const parsedTools: ToolDescription[] = [];

				for (const key in tools) {
					parsedTools.push({
						name: key,
						description: tools[key].description,
					});
				}

				return {
					name,
					tools: parsedTools,
				};
			}),
		);

		return allTools as ServerToolsList;
	});
