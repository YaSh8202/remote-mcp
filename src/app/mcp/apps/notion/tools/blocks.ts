import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { NotionClientWrapper } from "../client";
import { commonIdDescription, formatError, formatParameter, notionAuth } from "../common";

// Append block children tool
const appendBlockChildrenSchema = {
	block_id: z
		.string()
		.describe(`The ID of the parent block.${commonIdDescription}`),
	children: z
		.array(z.record(z.unknown()))
		.describe("Array of block objects to append. Each block must follow the Notion block schema."),
	after: z
		.string()
		.optional()
		.describe(`The ID of the existing block that the new block should be appended after.${commonIdDescription}`),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const appendBlockChildrenTool = createParameterizedTool({
	name: "append_block_children",
	auth: notionAuth,
	description: "Append new children blocks to a specified parent block in Notion. Requires insert content capabilities.",
	paramsSchema: appendBlockChildrenSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(
				extra?.auth?.access_token || ""
			);

			const response = await client.appendBlockChildren(
				args.block_id,
				args.children
			);

			const result = args.format === "json" 
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
			console.error("Error appending block children:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error appending block children: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Retrieve block tool
const retrieveBlockSchema = {
	block_id: z
		.string()
		.describe(`The ID of the block to retrieve.${commonIdDescription}`),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const retrieveBlockTool = createParameterizedTool({
	name: "retrieve_block",
	auth: notionAuth,
	description: "Retrieve a block from Notion",
	paramsSchema: retrieveBlockSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(
				extra?.auth?.access_token || ""
			);

			const response = await client.retrieveBlock(args.block_id);

			const result = args.format === "json" 
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
			console.error("Error retrieving block:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving block: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Retrieve block children tool
const retrieveBlockChildrenSchema = {
	block_id: z
		.string()
		.describe(`The ID of the block.${commonIdDescription}`),
	start_cursor: z
		.string()
		.optional()
		.describe("Pagination cursor for next page of results"),
	page_size: z
		.number()
		.optional()
		.describe("Number of results per page (max 100)"),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const retrieveBlockChildrenTool = createParameterizedTool({
	name: "retrieve_block_children",
	auth: notionAuth,
	description: "Retrieve the children of a block",
	paramsSchema: retrieveBlockChildrenSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(
				extra?.auth?.access_token || ""
			);

			const response = await client.retrieveBlockChildren(
				args.block_id,
				args.start_cursor,
				args.page_size
			);

			const result = args.format === "json" 
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
			console.error("Error retrieving block children:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving block children: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Delete block tool
const deleteBlockSchema = {
	block_id: z
		.string()
		.describe(`The ID of the block to delete.${commonIdDescription}`),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const deleteBlockTool = createParameterizedTool({
	name: "delete_block",
	auth: notionAuth,
	description: "Delete a block in Notion",
	paramsSchema: deleteBlockSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(
				extra?.auth?.access_token || ""
			);

			const response = await client.deleteBlock(args.block_id);

			const result = args.format === "json" 
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
			console.error("Error deleting block:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error deleting block: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Update block tool
const updateBlockSchema = {
	block_id: z
		.string()
		.describe(`The ID of the block to update.${commonIdDescription}`),
	block: z
		.record(z.unknown())
		.describe("The updated content for the block. Must match the block's type schema."),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const updateBlockTool = createParameterizedTool({
	name: "update_block",
	auth: notionAuth,
	description: "Update the content of a block in Notion based on its type. The update replaces the entire value for a given field.",
	paramsSchema: updateBlockSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(
				extra?.auth?.access_token || ""
			);

			const response = await client.updateBlock(args.block_id, args.block);

			const result = args.format === "json" 
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
			console.error("Error updating block:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error updating block: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
