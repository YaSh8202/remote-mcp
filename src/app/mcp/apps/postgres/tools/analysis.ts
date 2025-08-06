import { z } from "zod";
import { createParameterizedTool } from "../../../mcp-app/tools";
import { PostgreSQLClient, validateConnectionString } from "../client";
import { formatPostgresError, postgresAuth } from "../common";

// Get top queries from pg_stat_statements
const getTopQueriesSchema = {
	sort_by: z
		.enum(["total_time", "mean_time", "calls", "resources"])
		.default("total_time")
		.describe(
			"Sort criteria: 'total_time', 'mean_time', 'calls', or 'resources'",
		),
	limit: z
		.number()
		.min(1)
		.max(100)
		.default(10)
		.describe("Number of queries to return"),
};

export const getTopQueriesTool = createParameterizedTool({
	name: "get_top_queries",
	auth: postgresAuth,
	description:
		"Reports the slowest SQL queries based on total execution time using pg_stat_statements data. Requires the pg_stat_statements extension to be installed.",
	paramsSchema: getTopQueriesSchema,
	callback: async (args, extra) => {
		try {
			const connectionString = extra?.auth;
			if (!connectionString) {
				throw new Error("PostgreSQL connection string is required");
			}

			if (!validateConnectionString(connectionString)) {
				throw new Error("Invalid PostgreSQL connection string format");
			}

			const client = new PostgreSQLClient(connectionString);

			// Check if pg_stat_statements extension is available
			const extensionCheck = await client.query(`
				SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
			`);

			if (extensionCheck.rows.length === 0) {
				await client.close();
				return {
					content: [
						{
							type: "text" as const,
							text: "The pg_stat_statements extension is not installed. Please install it using: CREATE EXTENSION pg_stat_statements;",
						},
					],
				};
			}

			let orderBy: string;
			let description: string;

			switch (args.sort_by) {
				case "total_time":
					orderBy = "total_exec_time DESC";
					description = "queries by total execution time";
					break;
				case "mean_time":
					orderBy = "mean_exec_time DESC";
					description = "queries by mean execution time";
					break;
				case "calls":
					orderBy = "calls DESC";
					description = "queries by number of calls";
					break;
				case "resources":
					orderBy = "total_exec_time * calls DESC";
					description = "queries by resource consumption (total_time * calls)";
					break;
				default:
					orderBy = "total_exec_time DESC";
					description = "queries by total execution time";
			}

			const result = await client.query(
				`
				SELECT 
					query,
					calls,
					total_exec_time,
					mean_exec_time,
					stddev_exec_time,
					rows,
					100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent,
					shared_blks_read,
					shared_blks_written,
					local_blks_read,
					local_blks_written,
					temp_blks_read,
					temp_blks_written
				FROM pg_stat_statements 
				ORDER BY ${orderBy}
				LIMIT $1
			`,
				[args.limit],
			);

			await client.close();

			return {
				content: [
					{
						type: "text" as const,
						text: `Top ${args.limit} ${description}:\n\n${client.formatResultAsText(result)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting top queries:", error);
			return formatPostgresError(error as Error);
		}
	},
});

// Analyze workload for index recommendations
const analyzeWorkloadIndexesSchema = {
	max_index_size_mb: z
		.number()
		.min(1)
		.default(10000)
		.describe("Maximum index size in MB"),
	min_calls: z
		.number()
		.min(1)
		.default(100)
		.describe("Minimum number of query calls to consider"),
};

export const analyzeWorkloadIndexesTool = createParameterizedTool({
	name: "analyze_workload_indexes",
	auth: postgresAuth,
	description:
		"Analyzes the database workload to identify resource-intensive queries and suggests potential indexes. Requires pg_stat_statements extension.",
	paramsSchema: analyzeWorkloadIndexesSchema,
	callback: async (args, extra) => {
		try {
			const connectionString = extra?.auth;
			if (!connectionString) {
				throw new Error("PostgreSQL connection string is required");
			}

			if (!validateConnectionString(connectionString)) {
				throw new Error("Invalid PostgreSQL connection string format");
			}

			const client = new PostgreSQLClient(connectionString);

			// Check if pg_stat_statements extension is available
			const extensionCheck = await client.query(`
				SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
			`);

			if (extensionCheck.rows.length === 0) {
				await client.close();
				return {
					content: [
						{
							type: "text" as const,
							text: "The pg_stat_statements extension is not installed. Please install it using: CREATE EXTENSION pg_stat_statements;",
						},
					],
				};
			}

			let output =
				"PostgreSQL Workload Analysis for Index Recommendations:\n\n";

			// Get resource-intensive queries
			const resourceQueries = await client.query(
				`
				SELECT 
					query,
					calls,
					total_exec_time,
					mean_exec_time,
					rows,
					100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
				FROM pg_stat_statements 
				WHERE calls >= $1
				ORDER BY total_exec_time * calls DESC
				LIMIT 20
			`,
				[args.min_calls],
			);

			output += "=== TOP RESOURCE-INTENSIVE QUERIES ===\n";
			output += "(Queries with high total execution time × call count)\n\n";
			output += client.formatResultAsText(resourceQueries);
			output += "\n\n";

			// Get slow queries
			const slowQueries = await client.query(
				`
				SELECT 
					query,
					calls,
					total_exec_time,
					mean_exec_time,
					100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
				FROM pg_stat_statements 
				WHERE calls >= $1 AND mean_exec_time > 100
				ORDER BY mean_exec_time DESC
				LIMIT 10
			`,
				[args.min_calls],
			);

			if (slowQueries.rows.length > 0) {
				output += "=== SLOW QUERIES ===\n";
				output += "(Queries with mean execution time > 100ms)\n\n";
				output += client.formatResultAsText(slowQueries);
				output += "\n\n";
			}

			// Check for missing indexes (tables with high sequential scan ratios)
			const seqScanStats = await client.query(`
				SELECT 
					schemaname,
					tablename,
					seq_scan,
					seq_tup_read,
					idx_scan,
					idx_tup_fetch,
					CASE 
						WHEN seq_scan + idx_scan > 0 THEN 
							ROUND(100.0 * seq_scan / (seq_scan + idx_scan), 2)
						ELSE 0 
					END AS seq_scan_ratio
				FROM pg_stat_user_tables
				WHERE seq_scan > 0 
				ORDER BY seq_scan_ratio DESC, seq_tup_read DESC
				LIMIT 10
			`);

			if (seqScanStats.rows.length > 0) {
				output += "=== TABLES WITH HIGH SEQUENTIAL SCAN RATIOS ===\n";
				output += "(Consider adding indexes on frequently queried columns)\n\n";
				output += client.formatResultAsText(seqScanStats);
				output += "\n\n";
			}

			// Get table sizes to help with index size planning
			const tableSizes = await client.query(`
				SELECT 
					schemaname,
					tablename,
					pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
					pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
					pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
				FROM pg_tables 
				WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
				ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
				LIMIT 10
			`);

			if (tableSizes.rows.length > 0) {
				output += "=== LARGEST TABLES ===\n";
				output += "(Consider index impact on these tables)\n\n";
				output += client.formatResultAsText(tableSizes);
				output += "\n\n";
			}

			output += "=== INDEX RECOMMENDATIONS ===\n";
			output += "Based on the workload analysis above:\n\n";
			output +=
				"1. Review queries with high resource consumption and slow execution times\n";
			output +=
				"2. For tables with high sequential scan ratios, consider adding indexes on:\n";
			output += "   - Columns used in WHERE clauses\n";
			output += "   - Columns used in JOIN conditions\n";
			output += "   - Columns used in ORDER BY clauses\n";
			output +=
				"3. Monitor query plans using EXPLAIN ANALYZE before and after adding indexes\n";
			output += `4. Keep indexes under ${args.max_index_size_mb}MB when possible\n`;
			output +=
				"5. Consider composite indexes for queries with multiple filter conditions\n";

			await client.close();

			return {
				content: [
					{
						type: "text" as const,
						text: output,
					},
				],
			};
		} catch (error) {
			console.error("Error analyzing workload:", error);
			return formatPostgresError(error as Error);
		}
	},
});
