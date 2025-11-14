import { z } from "zod/v4";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { NotionClientWrapper } from "../client";
import {
	commonIdDescription,
	formatError,
	formatParameter,
	notionAuth,
} from "../common";
import type { RichTextItemResponse } from "../types";

// Create database tool
const createDatabaseSchema = {
	parent: z
		.union([
			z.object({
				page_id: z.string().describe(`Parent page ID.${commonIdDescription}`),
			}),
			z.object({
				workspace: z.boolean().describe("Set to true to create in workspace"),
			}),
		])
		.describe("Parent object of the database."),
	properties: z
		.record(z.string(), z.unknown())
		.describe("Property schema of the database."),
	title: z
		.array(z.record(z.string(), z.unknown()))
		.optional()
		.describe("Title of the database as a rich text array."),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const createDatabaseTool = createParameterizedTool({
	name: "create_database",
	auth: notionAuth,
	description: "Create a new database",
	paramsSchema: createDatabaseSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.createDatabase(
				args.parent,
				args.properties,
				args.title as RichTextItemResponse[] | undefined,
			);

			const result =
				args.format === "json"
					? JSON.stringify(response, null, 2)
					: await client.toMarkdown(response);

			return {
				content: [
					{
						type: "text" as const,
						text: result,
					},
				],
			};
		} catch (error) {
			console.error("Error creating database:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating database: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Query database tool
const queryDatabaseSchema = {
	database_id: z
		.string()
		.describe(`The ID of the database to query.${commonIdDescription}`),
	filter: z
		.record(z.string(), z.unknown())
		.optional()
		.describe("Filter conditions."),
	sorts: z
		.array(
			z.object({
				property: z.string().optional(),
				timestamp: z.string().optional(),
				direction: z.enum(["ascending", "descending"]),
			}),
		)
		.optional()
		.describe("Sorting conditions."),
	start_cursor: z
		.string()
		.optional()
		.describe("Cursor for the next page of results."),
	page_size: z
		.number()
		.optional()
		.describe("Number of results to retrieve (default: 100, max: 100)."),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const queryDatabaseTool = createParameterizedTool({
	name: "query_database",
	auth: notionAuth,
	description: "Query a database",
	paramsSchema: queryDatabaseSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.queryDatabase(
				args.database_id,
				args.filter,
				args.sorts,
				args.start_cursor,
				args.page_size,
			);

			const result =
				args.format === "json"
					? JSON.stringify(response, null, 2)
					: await client.toMarkdown(response);

			return {
				content: [
					{
						type: "text" as const,
						text: result,
					},
				],
			};
		} catch (error) {
			console.error("Error querying database:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error querying database: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Retrieve database tool
const retrieveDatabaseSchema = {
	database_id: z
		.string()
		.describe(`The ID of the database to retrieve.${commonIdDescription}`),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const retrieveDatabaseTool = createParameterizedTool({
	name: "retrieve_database",
	auth: notionAuth,
	description: "Retrieve information about a specific database",
	paramsSchema: retrieveDatabaseSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.retrieveDatabase(args.database_id);

			const result =
				args.format === "json"
					? JSON.stringify(response, null, 2)
					: await client.toMarkdown(response);

			return {
				content: [
					{
						type: "text" as const,
						text: result,
					},
				],
			};
		} catch (error) {
			console.error("Error retrieving database:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving database: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Update database tool
const updateDatabaseSchema = {
	database_id: z
		.string()
		.describe(`The ID of the database to update.${commonIdDescription}`),
	title: z
		.array(z.record(z.string(), z.unknown()))
		.optional()
		.describe("New title for the database."),
	description: z
		.array(z.record(z.string(), z.unknown()))
		.optional()
		.describe("New description for the database."),
	properties: z
		.record(z.string(), z.unknown())
		.optional()
		.describe("Updated property schema."),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const updateDatabaseTool = createParameterizedTool({
	name: "update_database",
	auth: notionAuth,
	description: "Update information about a database",
	paramsSchema: updateDatabaseSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.updateDatabase(
				args.database_id,
				args.title as RichTextItemResponse[] | undefined,
				args.description as RichTextItemResponse[] | undefined,
				args.properties,
			);

			const result =
				args.format === "json"
					? JSON.stringify(response, null, 2)
					: await client.toMarkdown(response);

			return {
				content: [
					{
						type: "text" as const,
						text: result,
					},
				],
			};
		} catch (error) {
			console.error("Error updating database:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error updating database: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Create database item tool
const createDatabaseItemSchema = {
	database_id: z
		.string()
		.describe(
			`The ID of the database to add the item to.${commonIdDescription}`,
		),
	properties: z
		.record(z.string(), z.unknown())
		.describe(
			"The properties of the new item. These should match the database schema.",
		),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const createDatabaseItemTool = createParameterizedTool({
	name: "create_database_item",
	auth: notionAuth,
	description: "Create a new item in a Notion database",
	paramsSchema: createDatabaseItemSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.createDatabaseItem(
				args.database_id,
				args.properties,
			);

			const result =
				args.format === "json"
					? JSON.stringify(response, null, 2)
					: await client.toMarkdown(response);

			return {
				content: [
					{
						type: "text" as const,
						text: result,
					},
				],
			};
		} catch (error) {
			console.error("Error creating database item:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating database item: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
