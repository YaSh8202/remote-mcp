import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { formatError, youtubeAuth } from "../common";

// Create playlist
const createPlaylistSchema = {
	title: z.string().describe("Playlist title"),
	description: z.string().optional().describe("Playlist description"),
	privacy: z
		.enum(["private", "public", "unlisted"])
		.optional()
		.describe("Playlist privacy setting"),
};

export const createPlaylistTool = createParameterizedTool({
	name: "create_playlist",
	auth: youtubeAuth,
	description: "Create a new YouTube playlist",
	paramsSchema: createPlaylistSchema,
	callback: async (args, extra) => {
		try {
			const playlistData = {
				snippet: {
					title: args.title,
					description: args.description || "",
				},
				status: {
					privacyStatus: args.privacy || "private",
				},
			};

			const response = await fetch(
				"https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${extra?.auth?.access_token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(playlistData),
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
						text: `Successfully created playlist "${args.title}":\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error creating playlist:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating playlist: ${formatError(error)}`,
					},
				],
			};
		}
	},
});

// Add video to playlist
const addVideoToPlaylistSchema = {
	playlistId: z.string().describe("Playlist ID"),
	videoId: z.string().describe("Video ID to add"),
	position: z.number().optional().describe("Position in playlist (0-based)"),
};

export const addVideoToPlaylistTool = createParameterizedTool({
	name: "add_video_to_playlist",
	auth: youtubeAuth,
	description: "Add a video to a YouTube playlist",
	paramsSchema: addVideoToPlaylistSchema,
	callback: async (args, extra) => {
		try {
			const playlistItemData = {
				snippet: {
					playlistId: args.playlistId,
					resourceId: {
						kind: "youtube#video",
						videoId: args.videoId,
					},
					...(args.position !== undefined && { position: args.position }),
				},
			};

			const response = await fetch(
				"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${extra?.auth?.access_token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(playlistItemData),
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
						text: `Successfully added video ${args.videoId} to playlist ${args.playlistId}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error adding video to playlist:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error adding video to playlist: ${formatError(error)}`,
					},
				],
			};
		}
	},
});

// Remove video from playlist
const removeVideoFromPlaylistSchema = {
	playlistItemId: z.string().describe("Playlist item ID to remove"),
};

export const removeVideoFromPlaylistTool = createParameterizedTool({
	name: "remove_video_from_playlist",
	auth: youtubeAuth,
	description: "Remove a video from a YouTube playlist",
	paramsSchema: removeVideoFromPlaylistSchema,
	callback: async (args, extra) => {
		try {
			const response = await fetch(
				`https://www.googleapis.com/youtube/v3/playlistItems?id=${args.playlistItemId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${extra?.auth?.access_token}`,
					},
				},
			);

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`YouTube API error: ${response.status} ${error}`);
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Successfully removed playlist item ${args.playlistItemId} from playlist`,
					},
				],
			};
		} catch (error) {
			console.error("Error removing video from playlist:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error removing video from playlist: ${formatError(error)}`,
					},
				],
			};
		}
	},
});

// List videos in playlist
const listPlaylistVideosSchema = {
	playlistId: z.string().describe("Playlist ID"),
	maxResults: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of results (1-50)"),
	pageToken: z.string().optional().describe("Page token for pagination"),
};

export const listPlaylistVideosTool = createParameterizedTool({
	name: "list_playlist_videos",
	auth: youtubeAuth,
	description: "List videos in a YouTube playlist",
	paramsSchema: listPlaylistVideosSchema,
	callback: async (args, extra) => {
		try {
			const params = new URLSearchParams({
				part: "snippet,contentDetails",
				playlistId: args.playlistId,
				maxResults: String(args.maxResults || 25),
			});

			if (args.pageToken) params.append("pageToken", args.pageToken);

			const response = await fetch(
				`https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
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
						text: `Found ${data.pageInfo?.totalResults || 0} videos in playlist ${args.playlistId}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error listing playlist videos:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error listing playlist videos: ${formatError(error)}`,
					},
				],
			};
		}
	},
});
