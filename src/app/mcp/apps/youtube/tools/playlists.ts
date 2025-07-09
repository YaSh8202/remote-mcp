import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { google } from "googleapis";
import { z } from "zod";
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

// Get playlist details
const getPlaylistSchema = {
	playlistId: z.string().describe("The YouTube playlist ID"),
	parts: z
		.array(z.string())
		.optional()
		.describe(
			"Parts of the playlist to retrieve (snippet, contentDetails, status)",
		),
};

export const getPlaylistTool = createParameterizedTool({
	name: "getPlaylist",
	auth: youtubeAuth,
	description: "Get detailed information about a YouTube playlist",
	paramsSchema: getPlaylistSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);
			const parts = args.parts || ["snippet", "contentDetails"];

			const result = await safelyExecute(async () => {
				const response = await youtube.playlists.list({
					part: parts,
					id: [args.playlistId],
				});

				return response.data.items?.[0] || null;
			});

			return {
				content: [
					{
						type: "text" as const,
						text: result
							? `Playlist details for ${args.playlistId}:\n\n${JSON.stringify(result, null, 2)}`
							: `Playlist not found: ${args.playlistId}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving playlist: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get playlist items
const getPlaylistItemsSchema = {
	playlistId: z.string().describe("The YouTube playlist ID"),
	maxResults: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of items to return (1-50)"),
	pageToken: z.string().optional().describe("Token for pagination"),
};

export const getPlaylistItemsTool = createParameterizedTool({
	name: "getPlaylistItems",
	auth: youtubeAuth,
	description: "Get videos in a YouTube playlist",
	paramsSchema: getPlaylistItemsSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				const response = await youtube.playlistItems.list({
					part: ["snippet", "contentDetails"],
					playlistId: args.playlistId,
					maxResults: args.maxResults || 25,
					pageToken: args.pageToken,
				});

				return {
					items: response.data.items || [],
					nextPageToken: response.data.nextPageToken,
					totalResults: response.data.pageInfo?.totalResults,
				};
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Playlist items for ${args.playlistId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving playlist items: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Search playlists
const searchPlaylistsSchema = {
	query: z.string().describe("Search query for playlists"),
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
};

export const searchPlaylistsTool = createParameterizedTool({
	name: "searchPlaylists",
	auth: youtubeAuth,
	description: "Search for YouTube playlists",
	paramsSchema: searchPlaylistsSchema,
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
					type: ["playlist"],
				});

				return response.data.items || [];
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Playlist search results for "${args.query}":\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching playlists: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get playlist video details
const getPlaylistVideoDetailsSchema = {
	playlistId: z.string().describe("The YouTube playlist ID"),
	maxResults: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of videos to return (1-50)"),
	includeDetails: z
		.boolean()
		.optional()
		.describe("Whether to include detailed video information"),
};

export const getPlaylistVideoDetailsTool = createParameterizedTool({
	name: "getPlaylistVideoDetails",
	auth: youtubeAuth,
	description: "Get detailed information about videos in a playlist",
	paramsSchema: getPlaylistVideoDetailsSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				// First get playlist items
				const playlistResponse = await youtube.playlistItems.list({
					part: ["snippet", "contentDetails"],
					playlistId: args.playlistId,
					maxResults: args.maxResults || 25,
				});

				const playlistItems = playlistResponse.data.items || [];

				// If detailed info is requested, get video details
				if (args.includeDetails && playlistItems.length > 0) {
					const videoIds = playlistItems
						.map((item) => item.contentDetails?.videoId)
						.filter((id): id is string => Boolean(id));

					if (videoIds.length > 0) {
						const videoResponse = await youtube.videos.list({
							part: ["snippet", "contentDetails", "statistics"],
							id: videoIds,
						});

						const videos = videoResponse.data.items || [];

						// Combine playlist items with video details
						return playlistItems.map((item) => ({
							...item,
							videoDetails: videos.find(
								(v) => v.id === item.contentDetails?.videoId,
							),
						}));
					}
				}

				return playlistItems;
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Playlist video details for ${args.playlistId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving playlist video details: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
