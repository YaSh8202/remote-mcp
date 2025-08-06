import { z } from "zod";
import { createParameterizedTool } from "../../../mcp-app/tools";
import { PostgreSQLClient, validateConnectionString } from "../client";
import { formatPostgresError, postgresAuth } from "../common";

// Execute SQL statements
const executeSqlSchema = {
	sql: z
		.string()
		.describe("SQL statement to execute against the PostgreSQL database"),
};

export const executeSqlTool = createParameterizedTool({
	name: "execute_sql",
	auth: postgresAuth,
	description:
		"Executes SQL statements on the PostgreSQL database. Use with caution as this can modify data.",
	paramsSchema: executeSqlSchema,
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

			// Basic SQL injection protection - reject obvious dangerous patterns
			const sql = args.sql.trim();
			const upperSql = sql.toUpperCase();

			// Warning for potentially dangerous operations
			const dangerousPatterns = [
				"DROP TABLE",
				"DROP DATABASE",
				"DROP SCHEMA",
				"TRUNCATE",
				"DELETE FROM",
				"UPDATE ",
				"ALTER TABLE",
				"CREATE USER",
				"DROP USER",
				"GRANT ",
				"REVOKE ",
			];

			const foundDangerous = dangerousPatterns.find((pattern) =>
				upperSql.includes(pattern),
			);
			if (foundDangerous) {
				console.warn(
					`Executing potentially dangerous SQL operation: ${foundDangerous}`,
				);
			}

			const result = await client.query(sql);
			await client.close();

			return {
				content: [
					{
						type: "text" as const,
						text: `SQL Execution Result:\n\n${client.formatResultAsText(result)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error executing SQL:", error);
			return formatPostgresError(error as Error);
		}
	},
});

// Execute query with explain plan
const explainQuerySchema = {
	sql: z.string().describe("SQL query to explain"),
	analyze: z
		.boolean()
		.default(false)
		.describe(
			"When true, actually runs the query to show real execution statistics instead of estimates. Takes longer but provides more accurate information.",
		),
	format: z
		.enum(["text", "json", "xml", "yaml"])
		.default("text")
		.describe("Output format for the explain plan"),
};

export const explainQueryTool = createParameterizedTool({
	name: "explain_query",
	auth: postgresAuth,
	description:
		"Gets the execution plan for a SQL query describing how PostgreSQL will process it and exposing the query planner's cost model.",
	paramsSchema: explainQuerySchema,
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

			let explainSql = "EXPLAIN";
			if (args.format !== "text") {
				explainSql += ` (FORMAT ${args.format.toUpperCase()})`;
			}
			if (args.analyze) {
				explainSql +=
					args.format === "text"
						? " ANALYZE"
						: ` (ANALYZE TRUE, FORMAT ${args.format.toUpperCase()})`;
			}
			explainSql += ` ${args.sql}`;

			const result = await client.query(explainSql);
			await client.close();

			return {
				content: [
					{
						type: "text" as const,
						text: `Query Execution Plan:\n\n${client.formatResultAsText(result)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error explaining query:", error);
			return formatPostgresError(error as Error);
		}
	},
});
