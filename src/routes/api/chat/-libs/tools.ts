import { createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ToolSet } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMcpServers, mcpServer } from "@/db/schema";
import { env } from "@/env";

export const getChatTools = async (
	userId: string,
	chatId: string,
): Promise<ToolSet> => {
	const tools: ToolSet = {};

	// Get chat MCP servers from the new table
	const chatMcpServersData = await db
		.select({
			chatMcpServer: chatMcpServers,
			mcpServerData: mcpServer,
		})
		.from(chatMcpServers)
		.leftJoin(mcpServer, eq(chatMcpServers.mcpServerId, mcpServer.id))
		.where(eq(chatMcpServers.chatId, chatId));

	for (const {
		chatMcpServer: chatServer,
		mcpServerData: serverData,
	} of chatMcpServersData) {
		if (chatServer.isRemoteMcp && serverData) {
			// Handle remote MCP server
			const httpTransport = new StreamableHTTPClientTransport(
				new URL(`${env.SERVER_URL}/api/mcp/${serverData.token}`),
				{
					requestInit: {
						headers: {
							"x-API-Key": env.MCP_SERVER_API_KEY,
							"X-User-Id": userId,
						},
					},
				},
			);

			const mcpClient = await createMCPClient({
				transport: httpTransport,
			});

			const serverTools = await mcpClient.tools();

			// Filter tools based on chat MCP server configuration
			if (chatServer.includeAllTools) {
				Object.assign(tools, serverTools);
			} else if (chatServer.tools && Array.isArray(chatServer.tools)) {
				// Only include selected tools
				for (const toolName of chatServer.tools) {
					if (serverTools[toolName]) {
						tools[toolName] = serverTools[toolName];
					}
				}
			}
		} else if (!chatServer.isRemoteMcp && chatServer.config) {
			// Handle direct MCP server configuration
			const { url, headers } = chatServer.config;
			if (url) {
				const httpTransport = new StreamableHTTPClientTransport(new URL(url), {
					requestInit: {
						headers: headers as Record<string, string> | undefined,
					},
				});

				const mcpClient = await createMCPClient({
					transport: httpTransport,
				});

				const serverTools = await mcpClient.tools();

				// Filter tools based on chat MCP server configuration
				if (chatServer.includeAllTools) {
					Object.assign(tools, serverTools);
				} else if (chatServer.tools && Array.isArray(chatServer.tools)) {
					// Only include selected tools
					for (const toolName of chatServer.tools) {
						if (serverTools[toolName]) {
							tools[toolName] = serverTools[toolName];
						}
					}
				}
			}
		}
	}

	return tools;
};
