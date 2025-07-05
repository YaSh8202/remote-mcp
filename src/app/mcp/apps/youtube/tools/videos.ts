import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { formatError, youtubeAuth } from "../common";

// Search videos
const searchVideosSchema = {
	q: z.string().describe("Search query"),
	order: z
		.enum(["date", "rating", "relevance", "title", "videoCount", "viewCount"])
		.optional()
		.describe("Order results by"),
	channelId: z.string().optional().describe("Channel ID to search within"),
	publishedAfter: z
		.string()
		.optional()
		.describe("Published after date (RFC 3339 format)"),
	publishedBefore: z
		.string()
		.optional()
		.describe("Published before date (RFC 3339 format)"),
	videoDuration: z
		.enum(["any", "long", "medium", "short"])
		.optional()
		.describe("Video duration filter"),
	videoDefinition: z
		.enum(["any", "high", "standard"])
		.optional()
		.describe("Video definition filter"),
	videoDimension: z
		.enum(["2d", "3d", "any"])
		.optional()
		.describe("Video dimension filter"),
	videoCategoryId: z.string().optional().describe("Video category ID filter"),
	maxResults: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of results (1-50)"),
};

export const searchVideosTool = createParameterizedTool({
	name: "search_videos",
	auth: youtubeAuth,
	description: "Search for YouTube videos with various filters",
	paramsSchema: searchVideosSchema,
	callback: async (args, extra) => {
		try {
			const params = new URLSearchParams({
				part: "snippet",
				type: "video",
				q: args.q,
				maxResults: String(args.maxResults || 25),
			});

			if (args.order) params.append("order", args.order);
			if (args.channelId) params.append("channelId", args.channelId);
			if (args.publishedAfter)
				params.append("publishedAfter", args.publishedAfter);
			if (args.publishedBefore)
				params.append("publishedBefore", args.publishedBefore);
			if (args.videoDuration)
				params.append("videoDuration", args.videoDuration);
			if (args.videoDefinition)
				params.append("videoDefinition", args.videoDefinition);
			if (args.videoDimension)
				params.append("videoDimension", args.videoDimension);
			if (args.videoCategoryId)
				params.append("videoCategoryId", args.videoCategoryId);

			const response = await fetch(
				`https://www.googleapis.com/youtube/v3/search?${params}`,
				{
					headers: {
						Authorization: `Bearer ${extra?.auth?.access_token}`,
					},
				},
			);

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`YouTube API error: ${response.status} ${error}`);
			}

			const data = await response.json();

			return {
				content: [
					{
						type: "text" as const,
						text: `Found ${data.pageInfo?.totalResults || 0} videos for "${args.q}":\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error searching videos:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching videos: ${formatError(error)}`,
					},
				],
			};
		}
	},
});

// Upload video
const uploadVideoSchema = {
	title: z.string().describe("Video title"),
	description: z.string().optional().describe("Video description"),
	tags: z.array(z.string()).optional().describe("Video tags"),
	categoryId: z.string().optional().describe("Video category ID"),
	privacy: z
		.enum(["private", "public", "unlisted"])
		.optional()
		.describe("Video privacy setting"),
	videoFile: z.string().describe("Base64 encoded video file or video URL"),
};

export const uploadVideoTool = createParameterizedTool({
	name: "upload_video",
	auth: youtubeAuth,
	description: "Upload a video to YouTube",
	paramsSchema: uploadVideoSchema,
	callback: async (args, _extra) => {
		try {
			// This is a simplified implementation - actual video upload requires multipart form data
			const metadata = {
				snippet: {
					title: args.title,
					description: args.description || "",
					tags: args.tags || [],
					categoryId: args.categoryId || "22", // People & Blogs default
				},
				status: {
					privacyStatus: args.privacy || "private",
				},
			};

			// Note: This is a placeholder - actual video upload requires handling multipart uploads
			// and would need proper file handling in a real implementation
			return {
				content: [
					{
						type: "text" as const,
						text: `Video upload initiated with metadata:\n${JSON.stringify(metadata, null, 2)}\n\nNote: This is a placeholder implementation. Actual video upload requires proper file handling and multipart upload to YouTube's upload endpoint.`,
					},
				],
			};
		} catch (error) {
			console.error("Error uploading video:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error uploading video: ${formatError(error)}`,
					},
				],
			};
		}
	},
});
