import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { NotionClientWrapper } from "../client";
import { commonIdDescription, formatError, formatParameter, notionAuth } from "../common";

// Retrieve page tool
const retrievePageSchema = {
	page_id: z
		.string()
		.describe(`The ID of the page to retrieve.${commonIdDescription}`),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const retrievePageTool = createParameterizedTool({
	name: "retrieve_page",
	auth: notionAuth,
	description: "Retrieve a page from Notion",
	paramsSchema: retrievePageSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(
				extra?.auth?.access_token || ""
			);

			const response = await client.retrievePage(args.page_id);

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
			console.error("Error retrieving page:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving page: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Update page properties tool
const updatePagePropertiesSchema = {
	page_id: z
		.string()
		.describe(`The ID of the page or database item to update.${commonIdDescription}`),
	properties: z
		.record(z.unknown())
		.describe("Properties to update. These correspond to the columns or fields in the database."),
	format: z
		.enum(["json", "markdown"])
		.optional()
		.default("markdown")
		.describe(formatParameter.description),
};

export const updatePagePropertiesTool = createParameterizedTool({
	name: "update_page_properties",
	auth: notionAuth,
	description: "Update properties of a page or an item in a Notion database",
	paramsSchema: updatePagePropertiesSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(
				extra?.auth?.access_token || ""
			);

			const response = await client.updatePageProperties(
				args.page_id,
				args.properties
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
			console.error("Error updating page properties:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error updating page properties: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
