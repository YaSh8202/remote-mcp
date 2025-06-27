import { db } from "@/db";
import { McpRunStatus, type NewMcpRun, mcpRuns } from "@/db/schema";
import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
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

	/**
	 * Get a run by ID with owner check
	 */
	async getRunById(runId: string, ownerId: string) {
		return await db.query.mcpRuns.findFirst({
			where: and(eq(mcpRuns.id, runId), eq(mcpRuns.ownerId, ownerId)),
			with: {
				server: true,
				app: true,
			},
		});
	}

	/**
	 * Get runs with pagination and filtering
	 */
	async getRunsPaginated(params: {
		offset: number;
		limit: number;
		ownerId: string;
		serverId?: string;
		serverIds?: string[];
		appName?: string;
		appNames?: string[];
		toolName?: string;
		status?: McpRunStatus | McpRunStatus[];
		search?: string;
		sortBy?: "createdAt" | "toolName" | "status";
		sortOrder?: "asc" | "desc";
	}) {
		const {
			offset,
			limit,
			ownerId,
			serverId,
			serverIds,
			appName,
			appNames,
			toolName,
			status,
			search,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = params;

		// Build where conditions
		const conditions = [eq(mcpRuns.ownerId, ownerId)];

		if (serverId) {
			conditions.push(eq(mcpRuns.serverId, serverId));
		}

		// Handle array of server IDs in the query
		if (serverIds && serverIds.length > 0) {
			conditions.push(inArray(mcpRuns.serverId, serverIds));
		}

		if (status) {
			if (Array.isArray(status)) {
				// For now, use the first status if array is provided
				if (status.length > 0) {
					conditions.push(eq(mcpRuns.status, status[0]));
				}
			} else {
				conditions.push(eq(mcpRuns.status, status));
			}
		}

		if (toolName) {
			conditions.push(eq(mcpRuns.toolName, toolName));
		}

		if (appName) {
			conditions.push(ilike(mcpRuns.metadata, `%"appName":"${appName}"%`));
		}

		if (search) {
			const searchCondition = or(
				ilike(mcpRuns.toolName, `%${search}%`),
				ilike(mcpRuns.metadata, `%${search}%`),
			);
			if (searchCondition) {
				conditions.push(searchCondition);
			}
		}

		// Build order by
		const orderBy =
			sortOrder === "desc" ? desc(mcpRuns[sortBy]) : mcpRuns[sortBy];

		// Get total count
		const totalResult = await db
			.select({ count: count() })
			.from(mcpRuns)
			.where(and(...conditions));

		const total = totalResult[0]?.count || 0;

		// Get paginated results
		const results = await db.query.mcpRuns.findMany({
			where: and(...conditions),
			orderBy: [orderBy],
			offset,
			limit: limit * 2, // Get more to allow for post-filtering
			with: {
				server: {
					columns: {
						id: true,
						name: true,
					},
				},
				app: {
					columns: {
						id: true,
						appName: true,
					},
				},
			},
		});

		// Apply array filters in post-processing
		let filteredResults = results;

		// Apply appNames filtering if needed
		if (appNames && appNames.length > 0) {
			filteredResults = filteredResults.filter((run) =>
				appNames.includes(run.app?.appName || ""),
			);
		}

		// Apply array status filtering if needed
		if (Array.isArray(status) && status.length > 1) {
			filteredResults = filteredResults.filter((run) =>
				status.includes(run.status),
			);
		}

		// Trim to requested page size
		const finalResults = filteredResults.slice(0, limit);

		return {
			data: finalResults,
			total: total, // Use original total since server and app filtering is done in query
			page: Math.floor(offset / limit) + 1,
			pageSize: limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Get runs for a specific server with pagination
	 */
	async getRunsForServerPaginated(params: {
		serverId: string;
		offset: number;
		limit: number;
		ownerId: string;
	}) {
		const { serverId, offset, limit, ownerId } = params;

		const conditions = [
			eq(mcpRuns.serverId, serverId),
			eq(mcpRuns.ownerId, ownerId),
		];

		// Get total count
		const totalResult = await db
			.select({ count: count() })
			.from(mcpRuns)
			.where(and(...conditions));

		const total = totalResult[0]?.count || 0;

		// Get paginated results
		const results = await db.query.mcpRuns.findMany({
			where: and(...conditions),
			orderBy: [desc(mcpRuns.createdAt)],
			offset,
			limit,
			with: {
				server: {
					columns: {
						id: true,
						name: true,
					},
				},
				app: {
					columns: {
						id: true,
						appName: true,
					},
				},
			},
		});

		return {
			data: results,
			total,
			page: Math.floor(offset / limit) + 1,
			pageSize: limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Get run statistics
	 */
	async getRunStats(params: {
		ownerId: string;
		serverId?: string;
		timeRange?: "24h" | "7d" | "30d" | "90d";
	}) {
		const { ownerId, serverId } = params;

		const conditions = [eq(mcpRuns.ownerId, ownerId)];

		if (serverId) {
			conditions.push(eq(mcpRuns.serverId, serverId));
		}

		// Get overall stats
		const totalRuns = await db
			.select({ count: count() })
			.from(mcpRuns)
			.where(and(...conditions));

		const successfulRuns = await db
			.select({ count: count() })
			.from(mcpRuns)
			.where(and(...conditions, eq(mcpRuns.status, McpRunStatus.SUCCESS)));

		const failedRuns = await db
			.select({ count: count() })
			.from(mcpRuns)
			.where(and(...conditions, eq(mcpRuns.status, McpRunStatus.FAILED)));

		return {
			total: totalRuns[0]?.count || 0,
			successful: successfulRuns[0]?.count || 0,
			failed: failedRuns[0]?.count || 0,
			successRate:
				totalRuns[0]?.count > 0
					? ((successfulRuns[0]?.count || 0) / totalRuns[0].count) * 100
					: 0,
		};
	}
}

export const mcpRunService = new McpRunService();
