import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { NotionClientWrapper } from "../client";
import { formatError, formatParameter, notionAuth } from "../common";

// Search tool
const searchSchema = {
	query: z
		.string()
		.optional()
		.describe("Text to search for in page or database titles"),
	filter: z
		.object({
			property: z.string(),
			value: z.string(),
		})
		.optional()
		.describe(
			"Criteria to limit results to either only pages or only databases",
		),
	sort: z
		.object({
			direction: z.enum(["ascending", "descending"]),
			timestamp: z.literal("last_edited_time"),
		})
		.optional()
		.describe("Criteria to sort the results"),
	start_cursor: z.string().optional().describe("Pagination start cursor."),
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

export const searchTool = createParameterizedTool({
	name: "search",
	auth: notionAuth,
	description: "Search pages or databases by title in Notion",
	paramsSchema: searchSchema,
	callback: async (args, extra) => {
		try {
			const client = new NotionClientWrapper(extra?.auth?.access_token || "");

			const response = await client.search(
				args.query,
				args.filter,
				args.sort,
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
			console.error("Error searching:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
