import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { firecrawlAuth } from "../common";

const crawlSchema = {
	url: z.string().describe("Starting URL for the crawl"),
	excludePaths: z
		.array(z.string())
		.optional()
		.describe("URL paths to exclude from crawling"),
	includePaths: z
		.array(z.string())
		.optional()
		.describe("Only crawl these URL paths"),
	maxDepth: z.number().optional().describe("Maximum link depth to crawl"),
	ignoreSitemap: z
		.boolean()
		.optional()
		.describe("Skip sitemap.xml discovery"),
	limit: z.number().optional().describe("Maximum number of pages to crawl"),
	allowBackwardLinks: z
		.boolean()
		.optional()
		.describe("Allow crawling backward links"),
	allowExternalLinks: z
		.boolean()
		.optional()
		.describe("Allow crawling external links"),
	deduplicateSimilarURLs: z
		.boolean()
		.optional()
		.describe("Remove similar URLs from crawling"),
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
};

export const firecrawlCrawlTool = createParameterizedTool({
	name: "crawl",
	auth: firecrawlAuth,
	description:
		"Start an asynchronous crawl job on a website and extract content from all pages. Best for extracting content from multiple related pages when you need comprehensive coverage. Warning: Crawl responses can be very large and may exceed token limits.",
	paramsSchema: crawlSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Firecrawl API key is required");
			}

			const response = await fetch("https://api.firecrawl.dev/v1/crawl", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					url: args.url,
					excludePaths: args.excludePaths,
					includePaths: args.includePaths,
					maxDepth: args.maxDepth,
					ignoreSitemap: args.ignoreSitemap,
					limit: args.limit,
					allowBackwardLinks: args.allowBackwardLinks,
					allowExternalLinks: args.allowExternalLinks,
					deduplicateSimilarURLs: args.deduplicateSimilarURLs,
					scrapeOptions: {
						formats: args.formats || ["markdown"],
						onlyMainContent: args.onlyMainContent,
						includeTags: args.includeTags,
						excludeTags: args.excludeTags,
						waitFor: args.waitFor,
					},
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
				throw new Error(result.error || "Crawl failed");
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Started crawl for ${args.url} with job ID: ${result.id}. Use checkCrawlStatus to check progress.`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error starting crawl: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
				isError: true,
			};
		}
	},
});
