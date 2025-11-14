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

// Get video analytics
const getVideoAnalyticsSchema = {
	videoId: z.string().describe("The YouTube video ID"),
	metrics: z
		.array(z.string())
		.optional()
		.describe("Metrics to retrieve (views, likes, dislikes, comments, shares)"),
	dimensions: z
		.array(z.string())
		.optional()
		.describe("Dimensions to group by (day, country, etc.)"),
	startDate: z
		.string()
		.optional()
		.describe("Start date for analytics (YYYY-MM-DD)"),
	endDate: z
		.string()
		.optional()
		.describe("End date for analytics (YYYY-MM-DD)"),
};

export const getVideoAnalyticsTool = createParameterizedTool({
	name: "getVideoAnalytics",
	auth: youtubeAuth,
	description: "Get analytics data for a YouTube video",
	paramsSchema: getVideoAnalyticsSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			// Get basic video statistics (this is available through the regular API)
			const result = await safelyExecute(async () => {
				const response = await youtube.videos.list({
					part: ["statistics", "snippet"],
					id: [args.videoId],
				});

				const video = response.data.items?.[0];
				if (!video) {
					throw new Error("Video not found");
				}

				return {
					videoId: args.videoId,
					title: video.snippet?.title,
					statistics: video.statistics,
					publishedAt: video.snippet?.publishedAt,
				};
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Video analytics for ${args.videoId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving video analytics: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get channel analytics
const getChannelAnalyticsSchema = {
	channelId: z.string().describe("The YouTube channel ID"),
	metrics: z
		.array(z.string())
		.optional()
		.describe("Metrics to retrieve (views, subscribers, videos, etc.)"),
	startDate: z
		.string()
		.optional()
		.describe("Start date for analytics (YYYY-MM-DD)"),
	endDate: z
		.string()
		.optional()
		.describe("End date for analytics (YYYY-MM-DD)"),
};

export const getChannelAnalyticsTool = createParameterizedTool({
	name: "getChannelAnalytics",
	auth: youtubeAuth,
	description: "Get analytics data for a YouTube channel",
	paramsSchema: getChannelAnalyticsSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			// Get basic channel statistics
			const result = await safelyExecute(async () => {
				const response = await youtube.channels.list({
					part: ["statistics", "snippet"],
					id: [args.channelId],
				});

				const channel = response.data.items?.[0];
				if (!channel) {
					throw new Error("Channel not found");
				}

				return {
					channelId: args.channelId,
					title: channel.snippet?.title,
					statistics: channel.statistics,
					publishedAt: channel.snippet?.publishedAt,
				};
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Channel analytics for ${args.channelId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving channel analytics: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Compare videos
const compareVideosSchema = {
	videoIds: z
		.array(z.string())
		.min(2)
		.max(10)
		.describe("Array of video IDs to compare (2-10 videos)"),
	metrics: z
		.array(z.string())
		.optional()
		.describe("Metrics to compare (views, likes, comments, etc.)"),
};

export const compareVideosTool = createParameterizedTool({
	name: "compareVideos",
	auth: youtubeAuth,
	description: "Compare analytics between multiple YouTube videos",
	paramsSchema: compareVideosSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				const response = await youtube.videos.list({
					part: ["statistics", "snippet"],
					id: args.videoIds,
				});

				const videos = response.data.items || [];

				return videos.map((video) => ({
					videoId: video.id,
					title: video.snippet?.title,
					statistics: video.statistics,
					publishedAt: video.snippet?.publishedAt,
				}));
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Video comparison results:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error comparing videos: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get trending videos
const getTrendingVideosSchema = {
	regionCode: z
		.string()
		.optional()
		.describe("Region code for trending videos (e.g., 'US', 'GB', 'CA')"),
	categoryId: z
		.string()
		.optional()
		.describe("Category ID to filter trending videos"),
	maxResults: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of results to return (1-50)"),
};

export const getTrendingVideosTool = createParameterizedTool({
	name: "getTrendingVideos",
	auth: youtubeAuth,
	description: "Get trending videos from YouTube",
	paramsSchema: getTrendingVideosSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				const response = await youtube.videos.list({
					part: ["snippet", "statistics"],
					chart: "mostPopular",
					regionCode: args.regionCode || "US",
					videoCategoryId: args.categoryId,
					maxResults: args.maxResults || 25,
				});

				return response.data.items || [];
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Trending videos${args.regionCode ? ` in ${args.regionCode}` : ""}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving trending videos: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get video categories
const getVideoCategoriesSchema = {
	regionCode: z
		.string()
		.optional()
		.describe("Region code for video categories (e.g., 'US', 'GB', 'CA')"),
};

export const getVideoCategoresTool = createParameterizedTool({
	name: "getVideoCategories",
	auth: youtubeAuth,
	description: "Get YouTube video categories",
	paramsSchema: getVideoCategoriesSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				const response = await youtube.videoCategories.list({
					part: ["snippet"],
					regionCode: args.regionCode || "US",
				});

				return response.data.items || [];
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Video categories${args.regionCode ? ` for ${args.regionCode}` : ""}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving video categories: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
