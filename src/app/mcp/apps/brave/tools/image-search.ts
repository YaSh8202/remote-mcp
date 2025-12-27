import { BraveSearch } from "brave-search";
import { SafeSearchLevel } from "brave-search/dist/types.js";
import imageToBase64 from "image-to-base64";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { braveAuth } from "../common";

const imageSearchSchema = {
	query: z.string().describe("The term to search the internet for images of"),
	count: z
		.number()
		.min(1)
		.max(3)
		.optional()
		.describe("The number of images to return (1-3, default 1)"),
};

export const braveImageSearchTool = createParameterizedTool({
	name: "imageSearch",
	auth: braveAuth,
	description:
		"Search for images using the Brave Search API. Returns images as base64 encoded data that can be displayed.",
	paramsSchema: imageSearchSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Brave Search API key is required");
			}

			const braveSearch = new BraveSearch(apiKey);

			const result = await braveSearch.imageSearch(args.query, {
				count: args.count || 1,
				safesearch: SafeSearchLevel.Strict,
			});

			if (!result.results || result.results.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `No image search results found for "${args.query}"`,
						},
					],
				};
			}

			const imageContents = [];

			for (const image of result.results) {
				try {
					const base64 = await imageToBase64(image.properties.url);

					imageContents.push({
						type: "text" as const,
						text: `Title: ${image.title}`,
					});

					imageContents.push({
						type: "image" as const,
						data: base64,
						mimeType: "image/png",
					});
				} catch (_imageError) {
					// If we can't fetch a specific image, continue with the next one
					imageContents.push({
						type: "text" as const,
						text: `Title: ${image.title}\nURL: ${image.properties.url}\n(Could not load image)`,
					});
				}
			}

			return {
				content: imageContents,
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error performing image search: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
