import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod/v4";
import { firecrawlAuth } from "../common";

const batchScrapeSchema = {
	urls: z.array(z.string()).describe("Array of URLs to scrape"),
	formats: z
		.array(z.enum(["markdown", "html", "rawHtml", "screenshot", "links"]))
		.optional()
		.describe("Output formats for the scraped content"),
	onlyMainContent: z
		.boolean()
		.optional()
		.describe("Only return the main content of the page"),
	includeTags: z
		.array(z.string())
		.optional()
		.describe("HTML tags to include in the scraping"),
	excludeTags: z
		.array(z.string())
		.optional()
		.describe("HTML tags to exclude from the scraping"),
	waitFor: z
		.number()
		.optional()
		.describe("Time to wait before scraping (in milliseconds)"),
	timeout: z
		.number()
		.optional()
		.describe("Timeout for the scraping operation (in milliseconds)"),
	mobile: z.boolean().optional().describe("Use mobile user agent"),
	skipTlsVerification: z.boolean().optional().describe("Skip TLS verification"),
	headers: z
		.record(z.string(), z.string())
		.optional()
		.describe("Custom headers to include in the request"),
};

export const firecrawlBatchScrapeTool = createParameterizedTool({
	name: "batchScrape",
	auth: firecrawlAuth,
	description:
		"Scrape multiple URLs efficiently with built-in rate limiting and parallel processing. Best for retrieving content from multiple pages when you know exactly which pages to scrape.",
	paramsSchema: batchScrapeSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Firecrawl API key is required");
			}

			const response = await fetch(
				"https://api.firecrawl.dev/v1/batch/scrape",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify({
						urls: args.urls,
						formats: args.formats || ["markdown"],
						onlyMainContent: args.onlyMainContent,
						includeTags: args.includeTags,
						excludeTags: args.excludeTags,
						waitFor: args.waitFor,
						timeout: args.timeout,
						mobile: args.mobile,
						skipTlsVerification: args.skipTlsVerification,
						headers: args.headers,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Firecrawl API error: ${errorData.error || response.statusText}`,
				);
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Batch scraping failed");
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Batch operation queued with ID: ${result.id}. Use checkBatchStatus to check progress.`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error starting batch scrape: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
				isError: true,
			};
		}
	},
});
