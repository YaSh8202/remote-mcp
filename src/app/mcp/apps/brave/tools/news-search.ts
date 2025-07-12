import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { BraveSearch } from "brave-search";
import { z } from "zod";
import { braveAuth } from "../common";

const newsSearchSchema = {
	query: z
		.string()
		.describe(
			"The term to search the internet for news articles, trending topics, or recent events",
		),
	count: z
		.number()
		.min(1)
		.max(20)
		.optional()
		.describe("The number of results to return (1-20, default 10)"),
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

export const braveNewsSearchTool = createParameterizedTool({
	name: "newsSearch",
	auth: braveAuth,
	description:
		"Search for news articles using the Brave Search API. Use this for recent events, trending topics, or specific news stories.",
	paramsSchema: newsSearchSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Brave Search API key is required");
			}

			const braveSearch = new BraveSearch(apiKey);

			const result = await braveSearch.newsSearch(args.query, {
				count: args.count || 10,
				...(args.freshness ? { freshness: args.freshness } : {}),
			});

			if (!result.results || result.results.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `No news articles found for "${args.query}"`,
						},
					],
				};
			}

			const newsResults = result.results
				.map(
					(article) =>
						`Title: ${article.title}\nURL: ${article.url}\nAge: ${article.age}\nDescription: ${article.description}`,
				)
				.join("\n\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `News search results for "${args.query}":\n\n${newsResults}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error performing news search: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
