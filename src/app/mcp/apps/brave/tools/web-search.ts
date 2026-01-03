import { BraveSearch } from "brave-search";
import { SafeSearchLevel } from "brave-search/dist/types.js";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { braveAuth } from "../common";

const webSearchSchema = {
	query: z.string().describe("The term to search the internet for"),
	count: z
		.number()
		.min(1)
		.max(20)
		.optional()
		.describe("The number of results to return (1-20, default 10)"),
	offset: z
		.number()
		.min(0)
		.optional()
		.describe("The offset for pagination (default 0)"),
	freshness: z
		.union([
			z.enum(["pd", "pw", "pm", "py"]),
			z
				.string()
				.regex(
					/^\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}$/,
					"Date range must be in format YYYY-MM-DDtoYYYY-MM-DD",
				),
		])
		.optional()
		.describe(
			"Filters search results by when they were discovered. Options: pd (last 24h), pw (last 7 days), pm (last 31 days), py (last 365 days), or custom date range (YYYY-MM-DDtoYYYY-MM-DD)",
		),
};

export const braveWebSearchTool = createParameterizedTool({
	name: "webSearch",
	auth: braveAuth,
	description:
		"Perform a web search using the Brave Search API. Use this for general information gathering, recent events, or when you need diverse web sources.",
	paramsSchema: webSearchSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Brave Search API key is required");
			}

			const braveSearch = new BraveSearch(apiKey);

			const result = await braveSearch.webSearch(args.query, {
				count: args.count || 10,
				offset: args.offset || 0,
				safesearch: SafeSearchLevel.Strict,
				...(args.freshness ? { freshness: args.freshness } : {}),
			});

			if (!result.web || result.web.results.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `No web search results found for "${args.query}"`,
						},
					],
				};
			}

			const searchResults = result.web.results
				.map(
					(item) =>
						`Title: ${item.title}\nURL: ${item.url}\nDescription: ${item.description}`,
				)
				.join("\n\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `Web search results for "${args.query}":\n\n${searchResults}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error performing web search: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
