import { z } from "zod";
import { createParameterizedTool } from "../../../mcp-app/tools";
import { PostgreSQLClient, validateConnectionString } from "../client";
import { formatPostgresError, postgresAuth } from "../common";

const analyzeDbHealthSchema = {
	health_type: z.string().default("all").describe("Health check types to perform: 'basic', 'tables', 'indexes', 'connections', 'all'"),
};

export const analyzeDbHealthTool = createParameterizedTool({
	name: "analyze_db_health",
	auth: postgresAuth,
	description: "Performs basic database health checks including table sizes, connection info, and simple index analysis",
	paramsSchema: analyzeDbHealthSchema,
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
			let output = "PostgreSQL Database Health Analysis:\n\n";

			const healthTypes = args.health_type.split(",").map(t => t.trim().toLowerCase());
			const runAll = healthTypes.includes("all");

			// Test connection and get basic info
			try {
				const basicInfo = await client.query(`
					SELECT 
						current_database() as database_name,
						current_user as current_user,
						version() as version
				`);
				
				output += "=== DATABASE CONNECTION INFO ===\n";
				output += client.formatResultAsText(basicInfo);
				output += "\n\n";
			} catch (error) {
				await client.close();
				return {
					content: [
						{
							type: "text" as const,
							text: `Error connecting to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
						},
					],
				};
			}

			// Connection Health Check
			if (runAll || healthTypes.includes("connections")) {
				output += "=== CONNECTION HEALTH ===\n";
				try {
					const connInfo = await client.query(`
						SELECT 
							setting as max_connections,
							unit
						FROM pg_settings 
						WHERE name = 'max_connections'
					`);
					
					output += "Connection Settings:\n";
					output += client.formatResultAsText(connInfo);
					output += "\n";
				} catch (error) {
					output += `Error checking connection health: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
				}
			}

			// Table Size Analysis
			if (runAll || healthTypes.includes("tables")) {
				output += "=== TABLE SIZE ANALYSIS ===\n";
				try {
					const tableSizes = await client.query(`
						SELECT 
							schemaname,
							tablename,
							pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
							pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
						FROM pg_tables 
						WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
						ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
						LIMIT 10
					`);
					
					if (tableSizes.rows.length > 0) {
						output += "Largest Tables:\n";
						output += client.formatResultAsText(tableSizes);
					} else {
						output += "No user tables found.\n";
					}
					output += "\n";
				} catch (error) {
					output += `Error checking table sizes: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
				}
			}

			// Basic Index Analysis
			if (runAll || healthTypes.includes("indexes")) {
				output += "=== INDEX ANALYSIS ===\n";
				try {
					const indexInfo = await client.query(`
						SELECT 
							schemaname,
							tablename,
							indexname,
							pg_size_pretty(pg_relation_size(indexrelid)) as size
						FROM pg_stat_user_indexes
						WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
						ORDER BY pg_relation_size(indexrelid) DESC
						LIMIT 10
					`);
					
					if (indexInfo.rows.length > 0) {
						output += "Largest Indexes:\n";
						output += client.formatResultAsText(indexInfo);
					} else {
						output += "No user indexes found.\n";
					}
					output += "\n";
				} catch (error) {
					output += `Error checking indexes: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
				}
			}

			// Basic Statistics
			if (runAll || healthTypes.includes("basic")) {
				output += "=== BASIC STATISTICS ===\n";
				try {
					const stats = await client.query(`
						SELECT 
							(SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')) as user_tables,
							(SELECT count(*) FROM information_schema.views WHERE table_schema NOT IN ('information_schema', 'pg_catalog')) as user_views,
							(SELECT count(*) FROM pg_stat_user_indexes) as user_indexes
					`);
					
					output += "Database Object Counts:\n";
					output += client.formatResultAsText(stats);
					output += "\n";
				} catch (error) {
					output += `Error checking basic statistics: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
				}
			}

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
			console.error("Error analyzing database health:", error);
			return formatPostgresError(error as Error);
		}
	},
});
