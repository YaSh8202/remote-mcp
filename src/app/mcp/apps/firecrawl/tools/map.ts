import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { firecrawlAuth } from "../common";

const mapSchema = {
	url: z.string().describe("Starting URL for URL discovery"),
	search: z.string().optional().describe("Optional search term to filter URLs"),
	ignoreSitemap: z
		.boolean()
		.optional()
		.describe("Skip sitemap.xml discovery and only use HTML links"),
	sitemapOnly: z
		.boolean()
		.optional()
		.describe("Only use sitemap.xml for discovery, ignore HTML links"),
	includeSubdomains: z
		.boolean()
		.optional()
		.describe("Include URLs from subdomains in results"),
	limit: z.number().optional().describe("Maximum number of URLs to return"),
};

export const firecrawlMapTool = createParameterizedTool({
	name: "map",
	auth: firecrawlAuth,
	description:
		"Map a website to discover all indexed URLs on the site. Best for discovering URLs on a website before deciding what to scrape.",
	paramsSchema: mapSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Firecrawl API key is required");
			}

			const response = await fetch("https://api.firecrawl.dev/v1/map", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					url: args.url,
					search: args.search,
					ignoreSitemap: args.ignoreSitemap,
					sitemapOnly: args.sitemapOnly,
					includeSubdomains: args.includeSubdomains,
					limit: args.limit,
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
				throw new Error(result.error || "URL mapping failed");
			}

			const links = result.links || [];

			if (links.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `No URLs found for "${args.url}"`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Found ${links.length} URLs on ${args.url}:\n\n${links.join("\n")}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error mapping URLs: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
				isError: true,
			};
		}
	},
});
