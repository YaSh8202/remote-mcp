import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { ToolSearchProcessor } from "@mastra/core/processors";
import type { Tool } from "@mastra/core/tools";
import { PostgresStore } from "@mastra/pg";
import { env } from "@/env";
import type { getAIModel } from "./models";
import type { ToolSearchPool } from "./tools";

/** The AI SDK model instance produced by getAIModel (accepted by Agent's model). */
type ChatModel = ReturnType<typeof getAIModel>;

/**
 * Tool count above which the chat agent routes MCP tools through ToolSearchProcessor
 * (dynamic discovery) instead of exposing every tool upfront. Below this the tools are
 * passed directly via agent.stream({ toolsets }), as before.
 */
export const TOOL_SEARCH_THRESHOLD = 15;

export const CHAT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to the user's connected tools and integrations (MCP servers). Use the available tools when they help answer the user's request, and explain your reasoning clearly. Be concise and accurate.`;

/**
 * In tool-search mode the agent does not see every tool upfront — it discovers them
 * via `search_tools`. This augments the base prompt with how discovery works and which
 * integrations are connected, so the model searches effectively (and doesn't re-search
 * the same thing while waiting for results to appear on the next turn).
 */
function buildToolSearchInstructions(connectionLabels: string[]): string {
	const lines = [
		CHAT_SYSTEM_PROMPT,
		"",
		"Your tools are provided through dynamic discovery rather than all upfront. To use a tool, first call `search_tools` with keywords describing what you need; the best matches are activated automatically and become available to call on your NEXT turn. After searching, wait for the tools to appear and use them — do not call `search_tools` again for the same need.",
	];
	if (connectionLabels.length > 0) {
		lines.push(
			"",
			`Connected integrations you can discover tools for: ${connectionLabels.join(", ")}. Tool names are namespaced like \`s0_<integration>-<tool>\`.`,
		);
	}
	return lines.join("\n");
}

/**
 * Module-level Postgres storage so tool-approval snapshots persist and can be
 * resumed across separate HTTP requests (the approval round-trip). Mastra creates
 * its own tables under the `mastra` schema (kept out of the app's public/Drizzle
 * schema). Lazily constructed so the DB isn't touched at app boot.
 */
let storageSingleton: PostgresStore | undefined;

function getStorage(): PostgresStore {
	if (!storageSingleton) {
		storageSingleton = new PostgresStore({
			id: "mastra-chat",
			connectionString: env.DATABASE_URL,
			schemaName: "mastra",
		});
	}
	return storageSingleton;
}

/**
 * Builds a storage-backed chat agent for a single request, bound to the given
 * per-request model.
 *
 * The model MUST be real at construction time: Mastra resolves the agent's model
 * during internal tool preparation (convertTools → listToolsets → getModel),
 * which does NOT see a per-call `model` override. A placeholder model therefore
 * throws as soon as any tool is attached. The agent is registered on a per-request
 * Mastra instance that shares the module-level storage, so approval snapshots are
 * still persisted/resumable across requests.
 */
export function buildChatAgent(
	model: ChatModel,
	options?: {
		/**
		 * Flat pool of MCP tools to expose via ToolSearchProcessor (dynamic discovery)
		 * instead of upfront. When omitted, the agent is built exactly as before and
		 * tools flow through agent.stream({ toolsets }).
		 */
		toolSearchPool?: ToolSearchPool;
		/**
		 * Friendly names of connected integrations (e.g. ["github", "fetch"]). Only used
		 * in tool-search mode to tell the agent what it can discover tools for.
		 */
		connectionLabels?: string[];
	},
) {
	const toolSearchPool = options?.toolSearchPool;

	const agent = new Agent({
		id: "chat-agent",
		name: "chat-agent",
		instructions: toolSearchPool
			? buildToolSearchInstructions(options?.connectionLabels ?? [])
			: CHAT_SYSTEM_PROMPT,
		model,
		...(toolSearchPool
			? {
					inputProcessors: [
						new ToolSearchProcessor({
							// MCP toolsets are a broader union than Mastra's Tool type but are
							// structurally compatible at runtime (the processor only reads
							// name/description and re-injects the tool). Cast at this single
							// boundary so the looseness doesn't leak past the pool.
							tools: toolSearchPool as Record<string, Tool>,
							search: { topK: 3, minScore: 0.1, autoLoad: true },
							storage: "context",
						}),
					],
				}
			: {}),
	});

	const mastra = new Mastra({
		storage: getStorage(),
		agents: { "chat-agent": agent },
	});

	return mastra.getAgent("chat-agent");
}
