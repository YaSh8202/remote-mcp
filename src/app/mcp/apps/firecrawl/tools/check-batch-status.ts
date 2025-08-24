import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { firecrawlAuth } from "../common";

const checkBatchStatusSchema = {
	id: z.string().describe("The batch operation ID to check status for"),
};

export const firecrawlCheckBatchStatusTool = createParameterizedTool({
	name: "checkBatchStatus",
	auth: firecrawlAuth,
	description: "Check the status of a batch scraping operation.",
	paramsSchema: checkBatchStatusSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Firecrawl API key is required");
			}

			const response = await fetch(
				`https://api.firecrawl.dev/v1/batch/scrape/${args.id}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
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
				throw new Error(result.error || "Failed to check batch status");
			}

			const data = result.data;
			let statusText = `Batch Status: ${data.status}\n`;
			statusText += `Total URLs: ${data.total}\n`;
			statusText += `Completed: ${data.completed}\n`;
			statusText += `Failed: ${data.failed}\n`;
			statusText += `Credits Used: ${data.creditsUsed}\n`;

			if (data.expiresAt) {
				statusText += `Expires At: ${data.expiresAt}\n`;
			}

			// If completed, show the results
			if (data.status === "completed" && data.data) {
				statusText += "\n**Results:**\n";
				data.data.forEach(
					(
						item: {
							url: string;
							markdown?: string;
							metadata?: { title?: string };
						},
						index: number,
					) => {
						statusText += `\n--- URL ${index + 1}: ${item.url} ---\n`;
						if (item.markdown) {
							statusText += `${item.markdown.substring(0, 500)}${
								item.markdown.length > 500 ? "..." : ""
							}\n`;
						}
						if (item.metadata?.title) {
							statusText += `Title: ${item.metadata.title}\n`;
						}
					},
				);
			}

			return {
				content: [
					{
						type: "text" as const,
						text: statusText,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error checking batch status: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
				isError: true,
			};
		}
	},
});
