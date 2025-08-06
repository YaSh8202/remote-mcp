import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { formatError, makeSpotifyRequest, spotifyAuth } from "../common";

// Play music tool
const playMusicSchema = {
	uri: z
		.string()
		.optional()
		.describe("The Spotify URI to play (overrides type and id)"),
	type: z
		.enum(["track", "album", "artist", "playlist"])
		.optional()
		.describe("The type of item to play"),
	id: z.string().optional().describe("The Spotify ID of the item to play"),
	deviceId: z
		.string()
		.optional()
		.describe("The Spotify device ID to play on"),
};

export const playMusicTool = createParameterizedTool({
	name: "playMusic",
	auth: spotifyAuth,
	description: "Start playing a Spotify track, album, artist, or playlist",
	paramsSchema: playMusicSchema,
	callback: async (args, extra) => {
		try {
			const { uri, type, id, deviceId } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			if (!(uri || (type && id))) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Error: Must provide either a URI or both a type and ID",
						},
					],
					isError: true,
				};
			}

			let spotifyUri = uri;
			if (!spotifyUri && type && id) {
				spotifyUri = `spotify:${type}:${id}`;
			}

			const requestBody: Record<string, unknown> = {};
			
			if (spotifyUri) {
				if (type === "track") {
					requestBody.uris = [spotifyUri];
				} else {
					requestBody.context_uri = spotifyUri;
				}
			}

			if (deviceId) {
				requestBody.device_id = deviceId;
			}

			await makeSpotifyRequest("/me/player/play", accessToken, {
				method: "PUT",
				body: JSON.stringify(requestBody),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Started playing ${type || "music"} ${id ? `(ID: ${id})` : ""}`,
					},
				],
			};
		} catch (error) {
			console.error("Error playing music:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error playing music: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Pause playback tool
const pausePlaybackSchema = {
	deviceId: z
		.string()
		.optional()
		.describe("The Spotify device ID to pause playback on"),
};

export const pausePlaybackTool = createParameterizedTool({
	name: "pausePlayback",
	auth: spotifyAuth,
	description: "Pause Spotify playback on the active device",
	paramsSchema: pausePlaybackSchema,
	callback: async (args, extra) => {
		try {
			const { deviceId } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const url = deviceId ? `/me/player/pause?device_id=${deviceId}` : "/me/player/pause";

			await makeSpotifyRequest(url, accessToken, {
				method: "PUT",
			});

			return {
				content: [
					{
						type: "text" as const,
						text: "Playback paused",
					},
				],
			};
		} catch (error) {
			console.error("Error pausing playback:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error pausing playback: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Resume playback tool
const resumePlaybackSchema = {
	deviceId: z
		.string()
		.optional()
		.describe("The Spotify device ID to resume playback on"),
};

export const resumePlaybackTool = createParameterizedTool({
	name: "resumePlayback",
	auth: spotifyAuth,
	description: "Resume Spotify playback on the active device",
	paramsSchema: resumePlaybackSchema,
	callback: async (args, extra) => {
		try {
			const { deviceId } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const requestBody: Record<string, unknown> = {};
			if (deviceId) {
				requestBody.device_id = deviceId;
			}

			await makeSpotifyRequest("/me/player/play", accessToken, {
				method: "PUT",
				body: JSON.stringify(requestBody),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: "Playback resumed",
					},
				],
			};
		} catch (error) {
			console.error("Error resuming playback:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error resuming playback: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Skip to next track tool
const skipToNextSchema = {
	deviceId: z
		.string()
		.optional()
		.describe("The Spotify device ID to skip on"),
};

export const skipToNextTool = createParameterizedTool({
	name: "skipToNext",
	auth: spotifyAuth,
	description: "Skip to the next track in the current Spotify playback queue",
	paramsSchema: skipToNextSchema,
	callback: async (args, extra) => {
		try {
			const { deviceId } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const url = deviceId ? `/me/player/next?device_id=${deviceId}` : "/me/player/next";

			await makeSpotifyRequest(url, accessToken, {
				method: "POST",
			});

			return {
				content: [
					{
						type: "text" as const,
						text: "Skipped to next track",
					},
				],
			};
		} catch (error) {
			console.error("Error skipping to next track:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error skipping to next track: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Skip to previous track tool
const skipToPreviousSchema = {
	deviceId: z
		.string()
		.optional()
		.describe("The Spotify device ID to skip on"),
};

export const skipToPreviousTool = createParameterizedTool({
	name: "skipToPrevious",
	auth: spotifyAuth,
	description: "Skip to the previous track in the current Spotify playback queue",
	paramsSchema: skipToPreviousSchema,
	callback: async (args, extra) => {
		try {
			const { deviceId } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const url = deviceId ? `/me/player/previous?device_id=${deviceId}` : "/me/player/previous";

			await makeSpotifyRequest(url, accessToken, {
				method: "POST",
			});

			return {
				content: [
					{
						type: "text" as const,
						text: "Skipped to previous track",
					},
				],
			};
		} catch (error) {
			console.error("Error skipping to previous track:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error skipping to previous track: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Add to queue tool
const addToQueueSchema = {
	uri: z
		.string()
		.optional()
		.describe("The Spotify URI to add to queue (overrides type and id)"),
	type: z
		.enum(["track", "album", "artist", "playlist"])
		.optional()
		.describe("The type of item to add to queue"),
	id: z.string().optional().describe("The Spotify ID of the item to add to queue"),
	deviceId: z
		.string()
		.optional()
		.describe("The Spotify device ID to add the track to"),
};

export const addToQueueTool = createParameterizedTool({
	name: "addToQueue",
	auth: spotifyAuth,
	description: "Adds a track, album, artist or playlist to the playback queue",
	paramsSchema: addToQueueSchema,
	callback: async (args, extra) => {
		try {
			const { uri, type, id, deviceId } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			let spotifyUri = uri;
			if (!spotifyUri && type && id) {
				spotifyUri = `spotify:${type}:${id}`;
			}

			if (!spotifyUri) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Error: Must provide either a URI or both a type and ID",
						},
					],
					isError: true,
				};
			}

			const url = deviceId 
				? `/me/player/queue?uri=${encodeURIComponent(spotifyUri)}&device_id=${deviceId}`
				: `/me/player/queue?uri=${encodeURIComponent(spotifyUri)}`;

			await makeSpotifyRequest(url, accessToken, {
				method: "POST",
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Added item ${spotifyUri} to queue`,
					},
				],
			};
		} catch (error) {
			console.error("Error adding to queue:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error adding to queue: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Create playlist tool
const createPlaylistSchema = {
	name: z.string().describe("The name of the playlist"),
	description: z
		.string()
		.optional()
		.describe("The description of the playlist"),
	public: z
		.boolean()
		.optional()
		.describe("Whether the playlist should be public"),
};

export const createPlaylistTool = createParameterizedTool({
	name: "createPlaylist",
	auth: spotifyAuth,
	description: "Create a new playlist on Spotify",
	paramsSchema: createPlaylistSchema,
	callback: async (args, extra) => {
		try {
			const { name, description, public: isPublic = false } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			// First get the current user's ID
			const userResponse = await makeSpotifyRequest("/me", accessToken);
			const userData = await userResponse.json();
			const userId = userData.id;

			// Create the playlist
			const response = await makeSpotifyRequest(`/users/${userId}/playlists`, accessToken, {
				method: "POST",
				body: JSON.stringify({
					name,
					description,
					public: isPublic,
				}),
			});

			const result = await response.json();

			return {
				content: [
					{
						type: "text" as const,
						text: `Successfully created playlist "${name}"\nPlaylist ID: ${result.id}`,
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
				isError: true,
			};
		}
	},
});

// Add tracks to playlist tool
const addTracksToPlaylistSchema = {
	playlistId: z.string().describe("The Spotify ID of the playlist"),
	trackIds: z.array(z.string()).describe("Array of Spotify track IDs to add"),
	position: z
		.number()
		.nonnegative()
		.optional()
		.describe("Position to insert the tracks (0-based index)"),
};

export const addTracksToPlaylistTool = createParameterizedTool({
	name: "addTracksToPlaylist",
	auth: spotifyAuth,
	description: "Add tracks to a Spotify playlist",
	paramsSchema: addTracksToPlaylistSchema,
	callback: async (args, extra) => {
		try {
			const { playlistId, trackIds, position } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			if (trackIds.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Error: No track IDs provided",
						},
					],
				};
			}

			const trackUris = trackIds.map((id) => `spotify:track:${id}`);

			const requestBody: Record<string, unknown> = {
				uris: trackUris,
			};

			if (position !== undefined) {
				requestBody.position = position;
			}

			await makeSpotifyRequest(`/playlists/${playlistId}/tracks`, accessToken, {
				method: "POST",
				body: JSON.stringify(requestBody),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Successfully added ${trackIds.length} track${trackIds.length === 1 ? "" : "s"} to playlist (ID: ${playlistId})`,
					},
				],
			};
		} catch (error) {
			console.error("Error adding tracks to playlist:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error adding tracks to playlist: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
