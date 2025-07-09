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

// Get channel details
const getChannelSchema = {
	channelId: z.string().describe("The YouTube channel ID"),
	parts: z
		.array(z.string())
		.optional()
		.describe(
			"Parts of the channel to retrieve (snippet, statistics, contentDetails)",
		),
};

export const getChannelTool = createParameterizedTool({
	name: "getChannel",
	auth: youtubeAuth,
	description: "Get detailed information about a YouTube channel",
	paramsSchema: getChannelSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);
			const parts = args.parts || ["snippet", "statistics", "contentDetails"];

			const result = await safelyExecute(async () => {
				const response = await youtube.channels.list({
					part: parts,
					id: [args.channelId],
				});

				return response.data.items?.[0] || null;
			});

			return {
				content: [
					{
						type: "text" as const,
						text: result
							? `Channel details for ${args.channelId}:\n\n${JSON.stringify(result, null, 2)}`
							: `Channel not found: ${args.channelId}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving channel: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get channel videos
const getChannelVideosSchema = {
	channelId: z.string().describe("The YouTube channel ID"),
	maxResults: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of videos to return (1-50)"),
	order: z
		.enum(["date", "rating", "relevance", "title", "viewCount"])
		.optional()
		.describe("Order of videos"),
};

export const getChannelVideosTool = createParameterizedTool({
	name: "getChannelVideos",
	auth: youtubeAuth,
	description: "Get videos from a specific YouTube channel",
	paramsSchema: getChannelVideosSchema,
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
					channelId: args.channelId,
					maxResults: args.maxResults || 25,
					order: args.order || "date",
					type: ["video"],
				});

				return response.data.items || [];
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Videos from channel ${args.channelId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving channel videos: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get channel playlists
const getChannelPlaylistsSchema = {
	channelId: z.string().describe("The YouTube channel ID"),
	maxResults: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of playlists to return (1-50)"),
};

export const getChannelPlaylistsTool = createParameterizedTool({
	name: "getChannelPlaylists",
	auth: youtubeAuth,
	description: "Get playlists from a specific YouTube channel",
	paramsSchema: getChannelPlaylistsSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				const response = await youtube.playlists.list({
					part: ["snippet", "contentDetails"],
					channelId: args.channelId,
					maxResults: args.maxResults || 25,
				});

				return response.data.items || [];
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Playlists from channel ${args.channelId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving channel playlists: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Search channels
const searchChannelsSchema = {
	query: z.string().describe("Search query for channels"),
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

export const searchChannelsTool = createParameterizedTool({
	name: "searchChannels",
	auth: youtubeAuth,
	description: "Search for YouTube channels",
	paramsSchema: searchChannelsSchema,
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
					type: ["channel"],
				});

				return response.data.items || [];
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Channel search results for "${args.query}":\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching channels: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get channel by username
const getChannelByUsernameSchema = {
	username: z.string().describe("The YouTube channel username"),
};

export const getChannelByUsernameTool = createParameterizedTool({
	name: "getChannelByUsername",
	auth: youtubeAuth,
	description: "Get channel information by username",
	paramsSchema: getChannelByUsernameSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("YouTube API key is required");
			}

			const youtube = createYouTubeClient(apiKey);

			const result = await safelyExecute(async () => {
				const response = await youtube.channels.list({
					part: ["snippet", "statistics", "contentDetails"],
					forUsername: args.username,
				});

				return response.data.items?.[0] || null;
			});

			return {
				content: [
					{
						type: "text" as const,
						text: result
							? `Channel details for @${args.username}:\n\n${JSON.stringify(result, null, 2)}`
							: `Channel not found: @${args.username}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving channel: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
