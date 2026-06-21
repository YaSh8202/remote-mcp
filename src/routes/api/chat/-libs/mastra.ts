import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { PostgresStore } from "@mastra/pg";
import { env } from "@/env";
import type { getAIModel } from "./models";

/** The AI SDK model instance produced by getAIModel (accepted by Agent's model). */
type ChatModel = ReturnType<typeof getAIModel>;

export const CHAT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to the user's connected tools and integrations (MCP servers). Use the available tools when they help answer the user's request, and explain your reasoning clearly. Be concise and accurate.`;

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
export function buildChatAgent(model: ChatModel) {
	const agent = new Agent({
		id: "chat-agent",
		name: "chat-agent",
		instructions: CHAT_SYSTEM_PROMPT,
		model,
	});

	const mastra = new Mastra({
		storage: getStorage(),
		agents: { "chat-agent": agent },
	});

	return mastra.getAgent("chat-agent");
}
