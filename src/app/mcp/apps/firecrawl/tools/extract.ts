import { z } from "zod/v4";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { firecrawlAuth } from "../common";

const extractSchema = {
	urls: z
		.array(z.string())
		.describe("Array of URLs to extract information from"),
	prompt: z.string().describe("Custom prompt for the LLM extraction"),
	systemPrompt: z
		.string()
		.optional()
		.describe("System prompt to guide the LLM"),
	schema: z
		.record(z.string(), z.unknown())
		.optional()
		.describe("JSON schema for structured data extraction"),
	allowExternalLinks: z
		.boolean()
		.optional()
		.describe("Allow extraction from external links"),
	enableWebSearch: z
		.boolean()
		.optional()
		.describe("Enable web search for additional context"),
	includeSubdomains: z
		.boolean()
		.optional()
		.describe("Include subdomains in extraction"),
};

export const firecrawlExtractTool = createParameterizedTool({
	name: "extract",
	auth: firecrawlAuth,
	description:
		"Extract structured information from web pages using LLM capabilities. Best for extracting specific structured data like prices, names, details.",
	paramsSchema: extractSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Firecrawl API key is required");
			}

			const response = await fetch("https://api.firecrawl.dev/v1/extract", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					urls: args.urls,
					prompt: args.prompt,
					systemPrompt: args.systemPrompt,
					schema: args.schema,
					allowExternalLinks: args.allowExternalLinks,
					enableWebSearch: args.enableWebSearch,
					includeSubdomains: args.includeSubdomains,
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
				throw new Error(result.error || "Extraction failed");
			}

			const extractedData = result.data;

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(extractedData, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error extracting data: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
				isError: true,
			};
		}
	},
});
