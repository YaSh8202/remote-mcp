import type { ToolsetsInput } from "@mastra/core/agent";
import { MCPClient } from "@mastra/mcp";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMcpServers, mcpServer } from "@/db/schema";
import { env } from "@/env";

export type ChatToolsResult = {
	/** Tools grouped by server (bare, un-namespaced names), ready for agent.stream({ toolsets }). */
	toolsets: ToolsetsInput;
	/** Disconnect the underlying MCP client(s); call after the stream finishes. */
	disconnect: () => Promise<void>;
};

/**
 * Builds the per-chat MCP toolsets for a Mastra agent via @mastra/mcp's MCPClient.
 *
 * Uses listToolsets() (not listTools()) so tool names stay bare and grouped by
 * server — matching the names stored in chatMcpServers.tools and preserving the
 * existing per-chat include/cherry-pick filtering.
 */
export const getChatTools = async (
	userId: string,
	chatId: string,
): Promise<ChatToolsResult> => {
	const noop: ChatToolsResult = {
		toolsets: {},
		disconnect: async () => {},
	};

	const chatMcpServersData = await db
		.select({
			chatMcpServer: chatMcpServers,
			mcpServerData: mcpServer,
		})
		.from(chatMcpServers)
		.leftJoin(mcpServer, eq(chatMcpServers.mcpServerId, mcpServer.id))
		.where(eq(chatMcpServers.chatId, chatId));

	if (chatMcpServersData.length === 0) {
		return noop;
	}

	// Build a servers map keyed by a stable, unique server name. The key becomes
	// the toolset group name returned by listToolsets().
	const servers: Record<
		string,
		{
			url: URL;
			requestInit?: { headers?: Record<string, string> };
		}
	> = {};
	// Per-server tool filter: serverKey -> { includeAll, allowed Set<bareName> }
	const filters: Record<string, { includeAll: boolean; allowed: Set<string> }> =
		{};

	chatMcpServersData.forEach(
		({ chatMcpServer: chatServer, mcpServerData }, i) => {
			const serverKey = `s${i}`;

			if (chatServer.isRemoteMcp && mcpServerData) {
				servers[serverKey] = {
					url: new URL(`${env.SERVER_URL}/api/mcp/${mcpServerData.token}`),
					requestInit: {
						headers: {
							"x-API-Key": env.MCP_SERVER_API_KEY,
							"X-User-Id": userId,
						},
					},
				};
			} else if (!chatServer.isRemoteMcp && chatServer.config?.url) {
				servers[serverKey] = {
					url: new URL(chatServer.config.url),
					requestInit: {
						headers: chatServer.config.headers as
							| Record<string, string>
							| undefined,
					},
				};
			} else {
				return;
			}

			filters[serverKey] = {
				includeAll: Boolean(chatServer.includeAllTools),
				allowed:
					chatServer.tools && Array.isArray(chatServer.tools)
						? new Set(chatServer.tools as string[])
						: new Set<string>(),
			};
		},
	);

	if (Object.keys(servers).length === 0) {
		return noop;
	}

	// Unique id per request avoids "MCPClient already initialized" collisions
	// across concurrent chats.
	const mcpClient = new MCPClient({
		id: `chat-${chatId}-${Date.now().toString(36)}`,
		servers,
	});

	const grouped = await mcpClient.listToolsets();

	// Apply the per-chat include/cherry-pick filter, keyed by bare tool name.
	const toolsets: ToolsetsInput = {};
	for (const [serverKey, serverTools] of Object.entries(grouped)) {
		const filter = filters[serverKey];
		if (!filter) continue;
		if (filter.includeAll) {
			toolsets[serverKey] = serverTools;
			continue;
		}
		const selected: Record<string, (typeof serverTools)[string]> = {};
		for (const toolName of Object.keys(serverTools)) {
			if (filter.allowed.has(toolName)) {
				selected[toolName] = serverTools[toolName];
			}
		}
		if (Object.keys(selected).length > 0) {
			toolsets[serverKey] = selected;
		}
	}

	return {
		toolsets,
		disconnect: () => mcpClient.disconnect(),
	};
};
