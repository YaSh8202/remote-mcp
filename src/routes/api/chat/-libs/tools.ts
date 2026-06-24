import type { ToolsetsInput } from "@mastra/core/agent";
import { MCPClient } from "@mastra/mcp";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { chatMcpServers, mcpApps, mcpServer } from "@/db/schema";
import { env } from "@/env";

/** A single MCP tool as returned grouped under a server key by listToolsets(). */
type ChatTool = ToolsetsInput[string][string];

/** Flat pool of MCP tools, keyed by (collision-safe) tool name, for ToolSearchProcessor. */
export type ToolSearchPool = Record<string, ChatTool>;

export type ChatToolsResult = {
	/** Tools grouped by server (bare, un-namespaced names), ready for agent.stream({ toolsets }). */
	toolsets: ToolsetsInput;
	/** Total number of tools across all server groups (post include/cherry-pick filter). */
	toolCount: number;
	/**
	 * Friendly names of the connected integrations (e.g. ["github", "fetch"]) — the
	 * app names behind the remote servers plus host labels for external servers. Used
	 * to tell the agent which integrations it can discover tools for.
	 */
	connectionLabels: string[];
	/** Disconnect the underlying MCP client(s); call after the stream finishes. */
	disconnect: () => Promise<void>;
};

/**
 * Flattens server-grouped toolsets into a single flat `Record<toolName, tool>` for
 * ToolSearchProcessor (which takes a flat pool in the Agent constructor, not the
 * grouped `toolsets` shape used by agent.stream()).
 *
 * Bare tool names can collide across servers (e.g. two servers both expose `query`).
 * On collision the duplicate key is prefixed with its server key (`s0`, `s1`, …); the
 * first occurrence keeps its bare name. The prefixed key is what the model searches/
 * loads by — the tool's own `execute` closure still carries the real MCP name, so the
 * underlying invocation is unaffected.
 */
export const flattenToolsets = (toolsets: ToolsetsInput): ToolSearchPool => {
	const flat: ToolSearchPool = {};
	for (const [serverKey, serverTools] of Object.entries(toolsets)) {
		for (const [toolName, tool] of Object.entries(serverTools)) {
			const key = toolName in flat ? `${serverKey}_${toolName}` : toolName;
			flat[key] = tool;
		}
	}
	return flat;
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
		toolCount: 0,
		connectionLabels: [],
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
	// IDs of remote servers (to look up their app names) + labels for external ones.
	const remoteServerIds: string[] = [];
	const externalLabels: string[] = [];

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
				remoteServerIds.push(mcpServerData.id);
			} else if (!chatServer.isRemoteMcp && chatServer.config?.url) {
				servers[serverKey] = {
					url: new URL(chatServer.config.url),
					requestInit: {
						headers: chatServer.config.headers as
							| Record<string, string>
							| undefined,
					},
				};
				externalLabels.push(new URL(chatServer.config.url).hostname);
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

	const toolCount = Object.values(toolsets).reduce(
		(sum, serverTools) => sum + Object.keys(serverTools).length,
		0,
	);

	// Friendly integration labels: app names behind the remote servers (github,
	// fetch, …) plus host labels for any external servers.
	const remoteApps =
		remoteServerIds.length > 0
			? await db
					.select({ appName: mcpApps.appName })
					.from(mcpApps)
					.where(inArray(mcpApps.serverId, remoteServerIds))
			: [];
	const connectionLabels = [
		...new Set([...remoteApps.map((a) => a.appName), ...externalLabels]),
	];

	return {
		toolsets,
		toolCount,
		connectionLabels,
		disconnect: () => mcpClient.disconnect(),
	};
};
