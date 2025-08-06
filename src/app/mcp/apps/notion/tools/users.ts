import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { NotionClientWrapper } from "../client";
import {
	commonIdDescription,
	formatError,
	formatParameter,
	notionAuth,
} from "../common";

// List all users tool
const listAllUsersSchema = {
	start_cursor: z
		.string()
		.optional()
		.describe("Pagination start cursor for listing users"),
	page_size: z
		.number()
		.optional()
		.describe("Number of users to retrieve (max 100)"),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const listAllUsersTool = createParameterizedTool({
	name: "list_all_users",
	auth: notionAuth,
	description:
		"List all users in the Notion workspace. **Note:** This function requires upgrading to the Notion Enterprise plan and using an Organization API key to avoid permission errors.",
	paramsSchema: listAllUsersSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.listAllUsers(
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
			console.error("Error listing users:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error listing users: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Retrieve user tool
const retrieveUserSchema = {
	user_id: z
		.string()
		.describe(`The ID of the user to retrieve.${commonIdDescription}`),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const retrieveUserTool = createParameterizedTool({
	name: "retrieve_user",
	auth: notionAuth,
	description:
		"Retrieve a specific user by user_id in Notion. **Note:** This function requires upgrading to the Notion Enterprise plan and using an Organization API key to avoid permission errors.",
	paramsSchema: retrieveUserSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.retrieveUser(args.user_id);

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
			console.error("Error retrieving user:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving user: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Retrieve bot user tool
const retrieveBotUserSchema = {
	random_string: z
		.string()
		.optional()
		.describe("Dummy parameter for no-parameter tools"),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const retrieveBotUserTool = createParameterizedTool({
	name: "retrieve_bot_user",
	auth: notionAuth,
	description:
		"Retrieve the bot user associated with the current token in Notion",
	paramsSchema: retrieveBotUserSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.retrieveBotUser();

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
			console.error("Error retrieving bot user:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving bot user: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
