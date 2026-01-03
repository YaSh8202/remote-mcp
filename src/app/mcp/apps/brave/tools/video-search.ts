import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { braveAuth } from "../common";

// Custom video search implementation since the brave-search library doesn't include video search
interface VideoSearchResult {
	title: string;
	url: string;
	description: string;
	age: string;
	video: {
		duration: string;
		views: string;
		creator: string;
		requires_subscription?: boolean;
		tags?: string[];
	};
}

interface VideoSearchResponse {
	type: "video";
	results: VideoSearchResult[];
}

const videoSearchSchema = {
	query: z.string().describe("The term to search for videos"),
	count: z
		.number()
		.min(1)
		.max(20)
		.optional()
		.describe("The number of videos to return (1-20, default 10)"),
	freshness: z
		.union([
			z.enum(["pd", "pw", "pm", "py"]),
			z
				.string()
				.regex(
					/^\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}$/,
					"Date range must be in format YYYY-MM-DDtoYYYY-MM-DD",
				),
		])
		.optional()
		.describe(
			"Filters search results by when they were discovered. Options: pd (last 24h), pw (last 7 days), pm (last 31 days), py (last 365 days), or custom date range (YYYY-MM-DDtoYYYY-MM-DD)",
		),
};

export const braveVideoSearchTool = createParameterizedTool({
	name: "videoSearch",
	auth: braveAuth,
	description:
		"Search for videos using the Brave Search API. Use this for video content, tutorials, or any media-related queries.",
	paramsSchema: videoSearchSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Brave Search API key is required");
			}

			// Direct API call to Brave's video search endpoint
			const url = new URL("https://api.search.brave.com/res/v1/videos/search");
			url.searchParams.set("q", args.query);
			url.searchParams.set("count", String(args.count || 10));
			url.searchParams.set("safesearch", "strict");

			if (args.freshness) {
				url.searchParams.set("freshness", args.freshness);
			}

			const response = await fetch(url.toString(), {
				method: "GET",
				headers: {
					Accept: "application/json",
					"Accept-Encoding": "gzip",
					"X-Subscription-Token": apiKey,
				},
			});

			if (!response.ok) {
				throw new Error(
					`Brave API error: ${response.status} ${response.statusText}`,
				);
			}

			const result = (await response.json()) as VideoSearchResponse;

			if (!result.results || result.results.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `No video search results found for "${args.query}"`,
						},
					],
				};
			}

			const videoResults = result.results
				.map((video) => {
					let videoInfo = `Title: ${video.title}\nURL: ${video.url}\nDescription: ${video.description}\nAge: ${video.age}`;

					if (video.video) {
						videoInfo += `\nDuration: ${video.video.duration}`;
						videoInfo += `\nViews: ${video.video.views}`;
						videoInfo += `\nCreator: ${video.video.creator}`;

						if (video.video.requires_subscription) {
							videoInfo += "\nRequires subscription";
						}

						if (video.video.tags && video.video.tags.length > 0) {
							videoInfo += `\nTags: ${video.video.tags.join(", ")}`;
						}
					}

					return videoInfo;
				})
				.join("\n\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `Video search results for "${args.query}":\n\n${videoResults}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error performing video search: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
