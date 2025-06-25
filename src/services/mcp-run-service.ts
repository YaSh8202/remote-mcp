import { db } from "@/db";
import { McpRunStatus, type NewMcpRun, mcpRuns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface McpRunInput {
	serverId: string;
	appId: string;
	appName: string;
	toolName: string;
	input: Record<string, unknown>;
	ownerId: string;
}

export interface McpRunResult {
	output: Record<string, unknown>;
	status: McpRunStatus;
}

export class McpRunService {
	/**
	 * Create a new MCP run record
	 */
	async createRun(input: McpRunInput): Promise<string> {
		const runId = nanoid();

		const newRun: NewMcpRun = {
			id: runId,
			serverId: input.serverId,
			appId: input.appId,
			toolName: input.toolName,
			metadata: {
				appName: input.appName,
				toolName: input.toolName,
			},
			input: input.input,
			output: {}, // Will be updated when run completes
			status: McpRunStatus.SUCCESS, // Will be updated based on result
			ownerId: input.ownerId,
		};

		await db.insert(mcpRuns).values(newRun);
		return runId;
	}

	/**
	 * Update a run with the result
	 */
	async updateRunResult(runId: string, result: McpRunResult): Promise<void> {
		await db
			.update(mcpRuns)
			.set({
				output: result.output,
				status: result.status,
				updatedAt: new Date(),
			})
			.where(eq(mcpRuns.id, runId));
	}

	/**
	 * Get a run by ID
	 */
	async getRun(runId: string) {
		return await db.query.mcpRuns.findFirst({
			where: eq(mcpRuns.id, runId),
		});
	}

	/**
	 * Get runs for a specific server
	 */
	async getRunsForServer(serverId: string) {
		return await db.query.mcpRuns.findMany({
			where: eq(mcpRuns.serverId, serverId),
			orderBy: (mcpRuns, { desc }) => [desc(mcpRuns.createdAt)],
		});
	}

	/**
	 * Get runs for a specific user
	 */
	async getRunsForUser(userId: string) {
		return await db.query.mcpRuns.findMany({
			where: eq(mcpRuns.ownerId, userId),
			orderBy: (mcpRuns, { desc }) => [desc(mcpRuns.createdAt)],
		});
	}
}

export const mcpRunService = new McpRunService();
