import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { firecrawlAuth } from "../common";

const generateLlmsTxtSchema = {
	url: z.string().describe("The base URL of the website to analyze"),
	maxUrls: z
		.number()
		.optional()
		.describe("Max number of URLs to include (default: 10)"),
	showFullText: z
		.boolean()
		.optional()
		.describe("Whether to include llms-full.txt contents in the response"),
};

export const firecrawlGenerateLlmsTxtTool = createParameterizedTool({
	name: "generateLlmsTxt",
	auth: firecrawlAuth,
	description:
		"Generate a standardized llms.txt (and optionally llms-full.txt) file for a given domain. This file defines how large language models should interact with the site.",
	paramsSchema: generateLlmsTxtSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Firecrawl API key is required");
			}

			const response = await fetch("https://api.firecrawl.dev/v1/llms-txt", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					url: args.url,
					maxUrls: args.maxUrls || 10,
					showFullText: args.showFullText || false,
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
				throw new Error(result.error || "LLMs.txt generation failed");
			}

			const data = result.data;
			let outputText = `**LLMs.txt file for ${args.url}:**\n\n`;

			if (data.llmsTxt) {
				outputText += "**llms.txt:**\n```\n";
				outputText += data.llmsTxt;
				outputText += "\n```\n\n";
			}

			if (args.showFullText && data.llmsFullTxt) {
				outputText += "**llms-full.txt:**\n```\n";
				outputText += data.llmsFullTxt;
				outputText += "\n```\n";
			}

			return {
				content: [
					{
						type: "text" as const,
						text: outputText,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error generating LLMs.txt: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
				isError: true,
			};
		}
	},
});
