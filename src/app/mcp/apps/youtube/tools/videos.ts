import { google } from "googleapis";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { youtubeAuth } from "../common";

// Initialize YouTube API client
const createYouTubeClient = (apiKey: string) => {
	return google.youtube({
		version: "v3",
		auth: apiKey,
	});
};

// Utility function to safely execute YouTube API calls
const safelyExecute = async <T>(fn: () => Promise<T>): Promise<T> => {
	try {
		return await fn();
	} catch (error) {
		throw new Error(
			`YouTube API error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
};

// Get video details
const getVideoSchema = {
	videoId: z.string().describe("The YouTube video ID"),
	parts: z
		.array(z.string())
		.optional()
		.describe(
			"Parts of the video to retrieve (snippet, contentDetails, statistics)",
		),
};

export const getVideoTool = createParameterizedTool({
	name: "getVideo",
	auth: youtubeAuth,
	description: "Get detailed information about a YouTube video",
	paramsSchema: getVideoSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);
			const parts = args.parts || ["snippet", "contentDetails", "statistics"];

			const result = await safelyExecute(async () => {
				const response = await youtube.videos.list({
					part: parts,
					id: [args.videoId],
				});

				return response.data.items?.[0] || null;
			});

			return {
				content: [
					{
						type: "text" as const,
						text: result
							? `Video details for ${args.videoId}:\n\n${JSON.stringify(result, null, 2)}`
							: `Video not found: ${args.videoId}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving video: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Search videos
const searchVideosSchema = {
	query: z.string().describe("Search query"),
	maxResults: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of results to return (1-50)"),
	order: z
		.enum(["date", "rating", "relevance", "title", "viewCount"])
		.optional()
		.describe("Order of results"),
	publishedAfter: z
		.string()
		.optional()
		.describe("Filter videos published after this date (RFC 3339)"),
	publishedBefore: z
		.string()
		.optional()
		.describe("Filter videos published before this date (RFC 3339)"),
	duration: z
		.enum(["short", "medium", "long"])
		.optional()
		.describe("Filter by video duration"),
};

export const searchVideosTool = createParameterizedTool({
	name: "searchVideos",
	auth: youtubeAuth,
	description: "Search for videos on YouTube",
	paramsSchema: searchVideosSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				const response = await youtube.search.list({
					part: ["snippet"],
					q: args.query,
					maxResults: args.maxResults || 10,
					order: args.order || "relevance",
					publishedAfter: args.publishedAfter,
					publishedBefore: args.publishedBefore,
					videoDuration: args.duration,
					type: ["video"],
				});

				return response.data.items || [];
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Search results for "${args.query}":\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching videos: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get video statistics
const getVideoStatsSchema = {
	videoId: z.string().describe("The YouTube video ID"),
};

export const getVideoStatsTool = createParameterizedTool({
	name: "getVideoStats",
	auth: youtubeAuth,
	description: "Get video statistics like views, likes, and comments",
	paramsSchema: getVideoStatsSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				const response = await youtube.videos.list({
					part: ["statistics"],
					id: [args.videoId],
				});

				return response.data.items?.[0]?.statistics || null;
			});

			return {
				content: [
					{
						type: "text" as const,
						text: result
							? `Video statistics for ${args.videoId}:\n\n${JSON.stringify(result, null, 2)}`
							: `Video not found: ${args.videoId}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving video stats: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get video comments
const getVideoCommentsSchema = {
	videoId: z.string().describe("The YouTube video ID"),
	maxResults: z
		.number()
		.min(1)
		.max(100)
		.optional()
		.describe("Maximum number of comments to return (1-100)"),
	order: z.enum(["time", "relevance"]).optional().describe("Order of comments"),
};

export const getVideoCommentsTool = createParameterizedTool({
	name: "getVideoComments",
	auth: youtubeAuth,
	description: "Get comments for a YouTube video",
	paramsSchema: getVideoCommentsSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				const response = await youtube.commentThreads.list({
					part: ["snippet"],
					videoId: args.videoId,
					maxResults: args.maxResults || 20,
					order: args.order || "relevance",
				});

				return response.data.items || [];
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Comments for video ${args.videoId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving comments: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
