import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { firecrawlAuth } from "../common";

const scrapeSchema = {
	url: z.string().describe("The URL to scrape"),
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
	mobile: z
		.boolean()
		.optional()
		.describe("Use mobile user agent"),
	skipTlsVerification: z
		.boolean()
		.optional()
		.describe("Skip TLS verification"),
	headers: z
		.record(z.string())
		.optional()
		.describe("Custom headers to include in the request"),
};

export const firecrawlScrapeTool = createParameterizedTool({
	name: "scrape",
	auth: firecrawlAuth,
	description:
		"Scrape content from a single URL with advanced options. Best for single page content extraction when you know exactly which page contains the information.",
	paramsSchema: scrapeSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Firecrawl API key is required");
			}

			const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					url: args.url,
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
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Firecrawl API error: ${errorData.error || response.statusText}`,
				);
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Scraping failed");
			}

			const content = result.data;
			const output = [];

			if (content.markdown) {
				output.push(`**Markdown Content:**\n${content.markdown}`);
			}

			if (content.html) {
				output.push(`**HTML Content:**\n${content.html}`);
			}

			if (content.rawHtml) {
				output.push(`**Raw HTML:**\n${content.rawHtml}`);
			}

			if (content.screenshot) {
				output.push(`**Screenshot URL:** ${content.screenshot}`);
			}

			if (content.links && content.links.length > 0) {
				output.push(`**Links Found:**\n${content.links.join("\n")}`);
			}

			if (content.metadata) {
				const metadata = content.metadata;
				const metadataText = [
					metadata.title && `Title: ${metadata.title}`,
					metadata.description && `Description: ${metadata.description}`,
					metadata.language && `Language: ${metadata.language}`,
					metadata.sourceURL && `Source URL: ${metadata.sourceURL}`,
				]
					.filter(Boolean)
					.join("\n");

				if (metadataText) {
					output.push(`**Metadata:**\n${metadataText}`);
				}
			}

			return {
				content: [
					{
						type: "text" as const,
						text: output.length > 0 ? output.join("\n\n") : "No content found",
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error scraping URL: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
				isError: true,
			};
		}
	},
});
