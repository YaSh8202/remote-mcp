import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { firecrawlAuth } from "../common";

const searchSchema = {
	query: z.string().describe("The search query"),
	limit: z
		.number()
		.min(1)
		.max(20)
		.optional()
		.describe("Number of search results to return (1-20, default 10)"),
	lang: z
		.string()
		.optional()
		.describe("Language code for search results (e.g., 'en', 'es', 'fr')"),
	country: z
		.string()
		.optional()
		.describe("Country code for search results (e.g., 'us', 'uk', 'ca')"),
	location: z
		.string()
		.optional()
		.describe("Location for localized search results"),
	tbs: z.string().optional().describe("Time-based search parameter"),
	scrapeOptions: z
		.object({
			formats: z
				.array(z.enum(["markdown", "html", "rawHtml", "screenshot", "links"]))
				.optional(),
			onlyMainContent: z.boolean().optional(),
		})
		.optional()
		.describe("Options for scraping the search result pages"),
};

export const firecrawlSearchTool = createParameterizedTool({
	name: "search",
	auth: firecrawlAuth,
	description:
		"Search the web and optionally extract content from search results. Best for finding specific information across multiple websites when you don't know which website has the information.",
	paramsSchema: searchSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Firecrawl API key is required");
			}

			const response = await fetch("https://api.firecrawl.dev/v1/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					query: args.query,
					limit: args.limit || 10,
					lang: args.lang,
					country: args.country,
					location: args.location,
					tbs: args.tbs,
					scrapeOptions: args.scrapeOptions,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Firecrawl API error: ${errorData.error || response.statusText}`,
				);
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Search failed");
			}

			const searchResults = result.data || [];

			if (searchResults.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `No search results found for "${args.query}"`,
						},
					],
				};
			}

			const formattedResults = searchResults
				.map(
					(
						item: {
							url: string;
							title?: string;
							description?: string;
							markdown?: string;
						},
						index: number,
					) => {
						let resultText = `**${index + 1}. ${item.title || "No title"}**\n`;
						resultText += `URL: ${item.url}\n`;
						if (item.description) {
							resultText += `Description: ${item.description}\n`;
						}
						if (item.markdown) {
							resultText += `Content:\n${item.markdown.substring(0, 300)}${
								item.markdown.length > 300 ? "..." : ""
							}\n`;
						}
						return resultText;
					},
				)
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `Search results for "${args.query}":\n\n${formattedResults}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
				isError: true,
			};
		}
	},
});
