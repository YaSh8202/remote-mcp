import { z } from "zod";
import { createParameterizedTool } from "../../../mcp-app/tools";
import { PostgreSQLClient, validateConnectionString } from "../client";
import { formatPostgresError, postgresAuth } from "../common";

// List all schemas in the database
const listSchemasSchema = {};

export const listSchemasTool = createParameterizedTool({
	name: "list_schemas",
	auth: postgresAuth,
	description: "Lists all database schemas available in the PostgreSQL instance.",
	paramsSchema: listSchemasSchema,
	callback: async (_args, extra) => {
		try {
			const connectionString = extra?.auth;
			if (!connectionString) {
				throw new Error("PostgreSQL connection string is required");
			}

			if (!validateConnectionString(connectionString)) {
				throw new Error("Invalid PostgreSQL connection string format");
			}

			const client = new PostgreSQLClient(connectionString);
			
			const result = await client.query(`
				SELECT
					schema_name,
					schema_owner,
					CASE
						WHEN schema_name LIKE 'pg_%' THEN 'System Schema'
						WHEN schema_name = 'information_schema' THEN 'System Information Schema'
						ELSE 'User Schema'
					END as schema_type
				FROM information_schema.schemata
				ORDER BY schema_type, schema_name
			`);

			await client.close();

			return {
				content: [
					{
						type: "text" as const,
						text: `PostgreSQL Schemas:\n\n${client.formatResultAsText(result)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error listing schemas:", error);
			return formatPostgresError(error as Error);
		}
	},
});

// List objects in a schema
const listObjectsSchema = {
	schema_name: z.string().describe("Schema name"),
	object_type: z.enum(["table", "view", "sequence", "extension"]).default("table").describe("Object type: 'table', 'view', 'sequence', or 'extension'"),
};

export const listObjectsTool = createParameterizedTool({
	name: "list_objects",
	auth: postgresAuth,
	description: "Lists database objects (tables, views, sequences, extensions) within a specified schema.",
	paramsSchema: listObjectsSchema,
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
			let query: string;
			let params: string[];

			if (args.object_type === "table" || args.object_type === "view") {
				const tableType = args.object_type === "table" ? "BASE TABLE" : "VIEW";
				query = `
					SELECT table_schema, table_name, table_type
					FROM information_schema.tables
					WHERE table_schema = $1 AND table_type = $2
					ORDER BY table_name
				`;
				params = [args.schema_name, tableType];
			} else if (args.object_type === "sequence") {
				query = `
					SELECT sequence_schema, sequence_name, data_type
					FROM information_schema.sequences
					WHERE sequence_schema = $1
					ORDER BY sequence_name
				`;
				params = [args.schema_name];
			} else if (args.object_type === "extension") {
				// Extensions are not schema-specific
				query = `
					SELECT extname, extversion, extrelocatable
					FROM pg_extension
					ORDER BY extname
				`;
				params = [];
			} else {
				throw new Error(`Unsupported object type: ${args.object_type}`);
			}

			const result = await client.query(query, params);
			await client.close();

			return {
				content: [
					{
						type: "text" as const,
						text: `PostgreSQL Objects (${args.object_type}) in schema '${args.schema_name}':\n\n${client.formatResultAsText(result)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error listing objects:", error);
			return formatPostgresError(error as Error);
		}
	},
});

// Get detailed information about a database object
const getObjectDetailsSchema = {
	schema_name: z.string().describe("Schema name"),
	object_name: z.string().describe("Object name"),
	object_type: z.enum(["table", "view", "sequence", "extension"]).default("table").describe("Object type: 'table', 'view', 'sequence', or 'extension'"),
};

export const getObjectDetailsTool = createParameterizedTool({
	name: "get_object_details",
	auth: postgresAuth,
	description: "Provides detailed information about a specific database object, for example, a table's columns, constraints, and indexes.",
	paramsSchema: getObjectDetailsSchema,
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
			let output = `Details for ${args.object_type} '${args.schema_name}.${args.object_name}':\n\n`;

			if (args.object_type === "table" || args.object_type === "view") {
				// Get columns
				const columnsResult = await client.query(`
					SELECT column_name, data_type, is_nullable, column_default
					FROM information_schema.columns
					WHERE table_schema = $1 AND table_name = $2
					ORDER BY ordinal_position
				`, [args.schema_name, args.object_name]);

				output += "COLUMNS:\n";
				output += client.formatResultAsText(columnsResult);
				output += "\n\n";

				// Get constraints
				const constraintsResult = await client.query(`
					SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
					FROM information_schema.table_constraints AS tc
					LEFT JOIN information_schema.key_column_usage AS kcu
					  ON tc.constraint_name = kcu.constraint_name
					 AND tc.table_schema = kcu.table_schema
					WHERE tc.table_schema = $1 AND tc.table_name = $2
					ORDER BY tc.constraint_name, kcu.ordinal_position
				`, [args.schema_name, args.object_name]);

				if (constraintsResult.rows.length > 0) {
					output += "CONSTRAINTS:\n";
					output += client.formatResultAsText(constraintsResult);
					output += "\n\n";
				}

				// Get indexes
				const indexesResult = await client.query(`
					SELECT indexname, indexdef
					FROM pg_indexes
					WHERE schemaname = $1 AND tablename = $2
				`, [args.schema_name, args.object_name]);

				if (indexesResult.rows.length > 0) {
					output += "INDEXES:\n";
					output += client.formatResultAsText(indexesResult);
				}

			} else if (args.object_type === "sequence") {
				const result = await client.query(`
					SELECT sequence_schema, sequence_name, data_type, start_value, increment
					FROM information_schema.sequences
					WHERE sequence_schema = $1 AND sequence_name = $2
				`, [args.schema_name, args.object_name]);

				output += client.formatResultAsText(result);

			} else if (args.object_type === "extension") {
				const result = await client.query(`
					SELECT extname, extversion, extrelocatable
					FROM pg_extension
					WHERE extname = $1
				`, [args.object_name]);

				output += client.formatResultAsText(result);
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
			console.error("Error getting object details:", error);
			return formatPostgresError(error as Error);
		}
	},
});
