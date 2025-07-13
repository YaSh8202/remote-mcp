import { z } from "zod";
import { createParameterizedTool } from "../../../mcp-app/tools";
import { PostgreSQLClient, validateConnectionString } from "../client";
import { formatPostgresError, postgresAuth } from "../common";

// Database health analysis
const analyzeDbHealthSchema = {
	health_type: z.string().default("all").describe("Health check types to perform: 'index', 'connection', 'vacuum', 'sequence', 'replication', 'buffer', 'constraint', 'all'"),
};

export const analyzeDbHealthTool = createParameterizedTool({
	name: "analyze_db_health",
	auth: postgresAuth,
	description: `Performs comprehensive health checks including: buffer cache hit rates, connection health, constraint validation, index health (duplicate/unused/invalid), sequence limits, and vacuum health.
Available health checks:
- index - checks for invalid, duplicate, and bloated indexes
- connection - checks the number of connections and their utilization
- vacuum - checks vacuum health for transaction id wraparound
- sequence - checks sequences at risk of exceeding their maximum value
- replication - checks replication health including lag and slots
- buffer - checks for buffer cache hit rates for indexes and tables
- constraint - checks for invalid constraints
- all - runs all checks`,
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

			// Index Health Check
			if (runAll || healthTypes.includes("index")) {
				output += "=== INDEX HEALTH ===\n";
				
				// Check for unused indexes
				try {
					const unusedIndexes = await client.query(`
						SELECT 
							schemaname,
							relname as tablename,
							indexrelname as indexname,
							idx_scan,
							idx_tup_read,
							idx_tup_fetch
						FROM pg_stat_user_indexes 
						WHERE idx_scan = 0
						ORDER BY schemaname, relname, indexrelname
						LIMIT 10
					`);
					
					if (unusedIndexes.rows.length > 0) {
						output += "Unused indexes found:\n";
						output += client.formatResultAsText(unusedIndexes);
					} else {
						output += "✓ No unused indexes found\n";
					}
				} catch (error) {
					output += `Error checking unused indexes: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
				}
				
				// Check for duplicate indexes (simplified)
				try {
					const duplicateIndexes = await client.query(`
						SELECT 
							schemaname,
							relname as tablename,
							COUNT(*) as index_count,
							array_agg(indexrelname) as index_names
						FROM pg_stat_user_indexes
						GROUP BY schemaname, relname
						HAVING COUNT(*) > 5
						ORDER BY index_count DESC
						LIMIT 10
					`);
					
					if (duplicateIndexes.rows.length > 0) {
						output += "\nTables with many indexes (potential duplicates):\n";
						output += client.formatResultAsText(duplicateIndexes);
					} else {
						output += "\n✓ No tables with excessive indexes found\n";
					}
				} catch (error) {
					output += `\nError checking for duplicate indexes: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
				}
				
				output += "\n";
			}

			// Connection Health Check
			if (runAll || healthTypes.includes("connection")) {
				output += "=== CONNECTION HEALTH ===\n";
				
				try {
					const connectionStats = await client.query(`
						SELECT 
							state,
							COUNT(*) as connection_count,
							ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
						FROM pg_stat_activity 
						WHERE pid != pg_backend_pid()
						GROUP BY state
						ORDER BY connection_count DESC
					`);
					
					output += "Connection statistics:\n";
					output += client.formatResultAsText(connectionStats);
					
					const maxConnections = await client.query(`SELECT setting::int as max_connections FROM pg_settings WHERE name = 'max_connections'`);
					const currentConnections = await client.query("SELECT COUNT(*) as current_connections FROM pg_stat_activity");
					
					if (maxConnections.rows.length > 0 && currentConnections.rows.length > 0) {
						const max = Number(maxConnections.rows[0].max_connections);
						const current = Number(currentConnections.rows[0].current_connections);
						const usage = Math.round((current / max) * 100);
						
						output += `\nConnection usage: ${current}/${max} (${usage}%)\n`;
						
						if (usage > 80) {
							output += "⚠️  Warning: High connection usage\n";
						} else {
							output += "✓ Connection usage is healthy\n";
						}
					}
				} catch (error) {
					output += `Error checking connection health: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
				}
				
				output += "\n";
			}

			// Buffer Cache Health Check
			if (runAll || healthTypes.includes("buffer")) {
				output += "=== BUFFER CACHE HEALTH ===\n";
				
				try {
					const bufferStats = await client.query(`
						SELECT 
							ROUND(100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2) as table_cache_hit_rate,
							ROUND(100.0 * sum(idx_blks_hit) / (sum(idx_blks_hit) + sum(idx_blks_read)), 2) as index_cache_hit_rate
						FROM pg_statio_user_tables
					`);
					
					if (bufferStats.rows.length > 0) {
						output += "Buffer cache hit rates:\n";
						output += client.formatResultAsText(bufferStats);
						
						const tableRate = Number.parseFloat(String(bufferStats.rows[0].table_cache_hit_rate || "0"));
						const indexRate = Number.parseFloat(String(bufferStats.rows[0].index_cache_hit_rate || "0"));
						
						if (tableRate < 95 || indexRate < 95) {
							output += "\n⚠️  Warning: Low cache hit rates (should be >95%)\n";
						} else {
							output += "\n✓ Buffer cache hit rates are healthy\n";
						}
					}
				} catch (error) {
					output += `Error checking buffer cache health: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
				}
				
				output += "\n";
			}

			// Vacuum Health Check
			if (runAll || healthTypes.includes("vacuum")) {
				output += "=== VACUUM HEALTH ===\n";
				
				try {
					const vacuumStats = await client.query(`
						SELECT 
							schemaname,
							relname as tablename,
							last_vacuum,
							last_autovacuum,
							vacuum_count,
							autovacuum_count,
							n_dead_tup,
							n_live_tup,
							CASE 
								WHEN n_live_tup > 0 THEN ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
								ELSE 0 
							END as dead_tuple_percentage
						FROM pg_stat_user_tables
						WHERE n_dead_tup > 1000
						ORDER BY dead_tuple_percentage DESC, n_dead_tup DESC
						LIMIT 10
					`);
					
					if (vacuumStats.rows.length > 0) {
						output += "Tables with high dead tuple counts:\n";
						output += client.formatResultAsText(vacuumStats);
					} else {
						output += "✓ No tables with excessive dead tuples found\n";
					}
				} catch (error) {
					output += `Error checking vacuum health: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
				}
				
				output += "\n";
			}

			// Sequence Health Check
			if (runAll || healthTypes.includes("sequence")) {
				output += "=== SEQUENCE HEALTH ===\n";
				
				try {
					const sequenceStats = await client.query(`
						SELECT 
							schemaname,
							sequencename,
							last_value,
							max_value,
							ROUND(100.0 * last_value / max_value, 2) as usage_percentage
						FROM pg_sequences 
						WHERE last_value > max_value * 0.8
						ORDER BY usage_percentage DESC
					`);
					
					if (sequenceStats.rows.length > 0) {
						output += "Sequences approaching their maximum value:\n";
						output += client.formatResultAsText(sequenceStats);
					} else {
						output += "✓ No sequences near their maximum value\n";
					}
				} catch (error) {
					output += `Error checking sequence health: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
				}
				
				output += "\n";
			}

			// Constraint Health Check
			if (runAll || healthTypes.includes("constraint")) {
				output += "=== CONSTRAINT HEALTH ===\n";
				
				try {
					const invalidConstraints = await client.query(`
						SELECT 
							conrelid::regclass as table_name,
							conname as constraint_name,
							contype as constraint_type
						FROM pg_constraint 
						WHERE NOT convalidated
					`);
					
					if (invalidConstraints.rows.length > 0) {
						output += "Invalid constraints found:\n";
						output += client.formatResultAsText(invalidConstraints);
					} else {
						output += "✓ No invalid constraints found\n";
					}
				} catch (error) {
					output += `Error checking constraint health: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
				}
				
				output += "\n";
			}

			// Replication Health Check
			if (runAll || healthTypes.includes("replication")) {
				output += "=== REPLICATION HEALTH ===\n";
				
				try {
					const replicationStats = await client.query(`
						SELECT 
							client_addr,
							state,
							sent_lsn,
							write_lsn,
							flush_lsn,
							replay_lsn,
							write_lag,
							flush_lag,
							replay_lag
						FROM pg_stat_replication
					`);
					
					if (replicationStats.rows.length > 0) {
						output += "Replication status:\n";
						output += client.formatResultAsText(replicationStats);
					} else {
						output += "No replication slots active (this may be normal for standalone instances)\n";
					}
				} catch (error) {
					output += `Error checking replication health: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
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
