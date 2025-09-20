import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod/v4";
import { NotionClientWrapper } from "../client";
import {
	commonIdDescription,
	formatError,
	formatParameter,
	notionAuth,
} from "../common";
import type { RichTextItemResponse } from "../types";

// Create comment tool
const createCommentSchema = {
	parent: z
		.object({
			page_id: z
				.string()
				.describe(`The ID of the page to comment on.${commonIdDescription}`),
		})
		.optional()
		.describe(
			"Parent object that specifies the page to comment on. Must include a page_id if used.",
		),
	discussion_id: z
		.string()
		.optional()
		.describe(
			`The ID of an existing discussion thread to add a comment to.${commonIdDescription}`,
		),
	rich_text: z
		.array(z.record(z.string(), z.unknown()))
		.describe("Array of rich text objects representing the comment content."),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const createCommentTool = createParameterizedTool({
	name: "create_comment",
	auth: notionAuth,
	description:
		"Create a comment in Notion. This requires the integration to have 'insert comment' capabilities. You can either specify a page parent or a discussion_id, but not both.",
	paramsSchema: createCommentSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			if (!args.parent && !args.discussion_id) {
				throw new Error(
					"Either parent.page_id or discussion_id must be provided",
				);
			}

			const response = await client.createComment(
				args.parent,
				args.discussion_id,
				args.rich_text as unknown as RichTextItemResponse[],
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
			console.error("Error creating comment:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating comment: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Retrieve comments tool
const retrieveCommentsSchema = {
	block_id: z
		.string()
		.describe(
			`The ID of the block or page whose comments you want to retrieve.${commonIdDescription}`,
		),
	start_cursor: z
		.string()
		.optional()
		.describe(
			"If supplied, returns a page of results starting after the cursor.",
		),
	page_size: z
		.number()
		.optional()
		.describe("Number of comments to retrieve (max 100)."),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const retrieveCommentsTool = createParameterizedTool({
	name: "retrieve_comments",
	auth: notionAuth,
	description:
		"Retrieve a list of unresolved comments from a Notion page or block. Requires the integration to have 'read comment' capabilities.",
	paramsSchema: retrieveCommentsSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.retrieveComments(
				args.block_id,
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
			console.error("Error retrieving comments:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving comments: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
