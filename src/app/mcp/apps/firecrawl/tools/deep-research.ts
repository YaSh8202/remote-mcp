import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { firecrawlAuth } from "../common";

const deepResearchSchema = {
	query: z.string().describe("The research question or topic to explore"),
	maxDepth: z
		.number()
		.optional()
		.describe("Maximum recursive depth for crawling/search (default: 3)"),
	timeLimit: z
		.number()
		.optional()
		.describe("Time limit in seconds for the research session (default: 120)"),
	maxUrls: z
		.number()
		.optional()
		.describe("Maximum number of URLs to analyze (default: 50)"),
};

export const firecrawlDeepResearchTool = createParameterizedTool({
	name: "deepResearch",
	auth: firecrawlAuth,
	description:
		"Conduct deep web research on a query using intelligent crawling, search, and LLM analysis. Best for complex research questions requiring multiple sources and in-depth analysis.",
	paramsSchema: deepResearchSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Firecrawl API key is required");
			}

			const response = await fetch("https://api.firecrawl.dev/v1/research", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					query: args.query,
					maxDepth: args.maxDepth || 3,
					timeLimit: args.timeLimit || 120,
					maxUrls: args.maxUrls || 50,
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
				throw new Error(result.error || "Deep research failed");
			}

			const data = result.data;
			let researchText = `**Deep Research Results for: "${args.query}"**\n\n`;

			if (data.finalAnalysis) {
				researchText += `**Analysis:**\n${data.finalAnalysis}\n\n`;
			}

			if (data.sources && data.sources.length > 0) {
				researchText += "**Sources:**\n";
				data.sources.forEach((source: { url: string; title?: string }, index: number) => {
					researchText += `${index + 1}. ${source.title || source.url}\n   ${source.url}\n`;
				});
				researchText += "\n";
			}

			if (data.activities && data.activities.length > 0) {
				researchText += "**Research Activities:**\n";
				data.activities.forEach((activity: { type: string; description?: string }, index: number) => {
					researchText += `${index + 1}. ${activity.type}: ${activity.description || "No description"}\n`;
				});
			}

			return {
				content: [
					{
						type: "text" as const,
						text: researchText,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error conducting deep research: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
				isError: true,
			};
		}
	},
});
