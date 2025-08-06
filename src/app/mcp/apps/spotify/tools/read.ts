import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { formatDuration, formatError, isTrack, makeSpotifyRequest, spotifyAuth } from "../common";

// Search Spotify tool
const searchSpotifySchema = {
	query: z.string().describe("The search query"),
	type: z
		.enum(["track", "album", "artist", "playlist"])
		.describe("The type of item to search for"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of results to return (1-50)"),
};

export const searchSpotifyTool = createParameterizedTool({
	name: "searchSpotify",
	auth: spotifyAuth,
	description: "Search for tracks, albums, artists, or playlists on Spotify",
	paramsSchema: searchSpotifySchema,
	callback: async (args, extra) => {
		try {
			const { query, type, limit = 10 } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const response = await makeSpotifyRequest(
				`/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`,
				accessToken
			);

			const results = await response.json();
			let formattedResults = "";

			if (type === "track" && results.tracks) {
				formattedResults = results.tracks.items
					.map((track: Record<string, unknown>, i: number) => {
						const artists = (track.artists as Array<Record<string, unknown>>).map((a) => a.name).join(", ");
						const duration = formatDuration(track.duration_ms as number);
						return `${i + 1}. "${track.name}" by ${artists} (${duration}) - ID: ${track.id}`;
					})
					.join("\n");
			} else if (type === "album" && results.albums) {
				formattedResults = results.albums.items
					.map((album: Record<string, unknown>, i: number) => {
						const artists = (album.artists as Array<Record<string, unknown>>).map((a) => a.name).join(", ");
						return `${i + 1}. "${album.name}" by ${artists} - ID: ${album.id}`;
					})
					.join("\n");
			} else if (type === "artist" && results.artists) {
				formattedResults = results.artists.items
					.map((artist: Record<string, unknown>, i: number) => {
						return `${i + 1}. "${artist.name}" - ID: ${artist.id}`;
					})
					.join("\n");
			} else if (type === "playlist" && results.playlists) {
				formattedResults = results.playlists.items
					.map((playlist: Record<string, unknown>, i: number) => {
						return `${i + 1}. "${playlist.name}" - ID: ${playlist.id}`;
					})
					.join("\n");
			}

			return {
				content: [
					{
						type: "text" as const,
						text: formattedResults.length > 0
							? `# Search results for "${query}" (type: ${type})\n\n${formattedResults}`
							: `No ${type} results found for "${query}"`,
					},
				],
			};
		} catch (error) {
			console.error("Error searching Spotify:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching for ${args.type}s: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get now playing tool
export const getNowPlayingTool = createParameterizedTool({
	name: "getNowPlaying",
	auth: spotifyAuth,
	description: "Get information about the currently playing track on Spotify",
	paramsSchema: {},
	callback: async (_args, extra) => {
		try {
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const response = await makeSpotifyRequest("/me/player/currently-playing", accessToken);
			
			if (response.status === 204) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Nothing is currently playing on Spotify",
						},
					],
				};
			}

			const currentTrack = await response.json();

			if (!currentTrack?.item) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Nothing is currently playing on Spotify",
						},
					],
				};
			}

			const track = currentTrack.item;
			if (isTrack(track)) {
				const artists = track.artists.map((a) => a.name).join(", ");
				const duration = formatDuration(track.duration_ms);
				const progress = formatDuration(currentTrack.progress_ms || 0);
				const isPlaying = currentTrack.is_playing ? "Playing" : "Paused";

				return {
					content: [
						{
							type: "text" as const,
							text: `# Currently ${isPlaying}\n\n**Track:** "${track.name}"\n**Artist:** ${artists}\n**Album:** ${track.album.name}\n**Progress:** ${progress} / ${duration}\n**Track ID:** ${track.id}`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text" as const,
						text: "Currently playing item is not a track",
					},
				],
			};
		} catch (error) {
			console.error("Error getting current track:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting current track: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get user's playlists tool
const getMyPlaylistsSchema = {
	limit: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of playlists to return (1-50)"),
	offset: z
		.number()
		.min(0)
		.optional()
		.describe("Offset for pagination (0-based index)"),
};

export const getMyPlaylistsTool = createParameterizedTool({
	name: "getMyPlaylists",
	auth: spotifyAuth,
	description: "Get a list of the current user's playlists on Spotify",
	paramsSchema: getMyPlaylistsSchema,
	callback: async (args, extra) => {
		try {
			const { limit = 20, offset = 0 } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const response = await makeSpotifyRequest(
				`/me/playlists?limit=${limit}&offset=${offset}`,
				accessToken
			);

			const playlists = await response.json();

			if (playlists.items.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "You don't have any playlists on Spotify",
						},
					],
				};
			}

			const formattedPlaylists = playlists.items
				.map((playlist: Record<string, unknown>, i: number) => {
					const tracksTotal = playlist.tracks && typeof playlist.tracks === 'object' && 
						'total' in playlist.tracks ? (playlist.tracks as Record<string, unknown>).total : 0;
					return `${offset + i + 1}. "${playlist.name}" (${tracksTotal} tracks) - ID: ${playlist.id}`;
				})
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `# Your Spotify Playlists (${offset + 1}-${offset + playlists.items.length} of ${playlists.total})\n\n${formattedPlaylists}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting playlists:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting playlists: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get playlist tracks tool
const getPlaylistTracksSchema = {
	playlistId: z.string().describe("The Spotify ID of the playlist"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of tracks to return (1-50)"),
	offset: z
		.number()
		.min(0)
		.optional()
		.describe("Offset for pagination (0-based index)"),
};

export const getPlaylistTracksTool = createParameterizedTool({
	name: "getPlaylistTracks",
	auth: spotifyAuth,
	description: "Get a list of tracks in a Spotify playlist",
	paramsSchema: getPlaylistTracksSchema,
	callback: async (args, extra) => {
		try {
			const { playlistId, limit = 50, offset = 0 } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const response = await makeSpotifyRequest(
				`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
				accessToken
			);

			const playlistTracks = await response.json();

			if ((playlistTracks.items?.length ?? 0) === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "This playlist doesn't have any tracks",
						},
					],
				};
			}

			const formattedTracks = playlistTracks.items
				.map((item: Record<string, unknown>, i: number) => {
					const { track } = item;
					if (!track) return `${offset + i + 1}. [Removed track]`;

					if (isTrack(track)) {
						const artists = track.artists.map((a) => a.name).join(", ");
						const duration = formatDuration(track.duration_ms);
						return `${offset + i + 1}. "${track.name}" by ${artists} (${duration}) - ID: ${track.id}`;
					}

					return `${offset + i + 1}. Unknown item`;
				})
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `# Tracks in Playlist (${offset + 1}-${offset + playlistTracks.items.length} of ${playlistTracks.total})\n\n${formattedTracks}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting playlist tracks:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting playlist tracks: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get recently played tracks tool
const getRecentlyPlayedSchema = {
	limit: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of tracks to return (1-50)"),
};

export const getRecentlyPlayedTool = createParameterizedTool({
	name: "getRecentlyPlayed",
	auth: spotifyAuth,
	description: "Get a list of recently played tracks on Spotify",
	paramsSchema: getRecentlyPlayedSchema,
	callback: async (args, extra) => {
		try {
			const { limit = 50 } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const response = await makeSpotifyRequest(
				`/me/player/recently-played?limit=${limit}`,
				accessToken
			);

			const history = await response.json();

			if (history.items.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "You don't have any recently played tracks on Spotify",
						},
					],
				};
			}

			const formattedHistory = history.items
				.map((item: Record<string, unknown>, i: number) => {
					const track = item.track;
					if (!track) return `${i + 1}. [Removed track]`;

					if (isTrack(track)) {
						const artists = track.artists.map((a) => a.name).join(", ");
						const duration = formatDuration(track.duration_ms);
						return `${i + 1}. "${track.name}" by ${artists} (${duration}) - ID: ${track.id}`;
					}

					return `${i + 1}. Unknown item`;
				})
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `# Recently Played Tracks\n\n${formattedHistory}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting recently played tracks:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting recently played tracks: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get user's saved tracks tool
const getUsersSavedTracksSchema = {
	limit: z
		.number()
		.min(1)
		.max(50)
		.optional()
		.describe("Maximum number of tracks to return (1-50)"),
	offset: z
		.number()
		.min(0)
		.optional()
		.describe("Offset for pagination (0-based index)"),
};

export const getUsersSavedTracksTool = createParameterizedTool({
	name: "getUsersSavedTracks",
	auth: spotifyAuth,
	description: 'Get a list of tracks saved in the user\'s "Liked Songs" library',
	paramsSchema: getUsersSavedTracksSchema,
	callback: async (args, extra) => {
		try {
			const { limit = 50, offset = 0 } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const response = await makeSpotifyRequest(
				`/me/tracks?limit=${limit}&offset=${offset}`,
				accessToken
			);

			const savedTracks = await response.json();

			if (savedTracks.items.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "You don't have any saved tracks in your Liked Songs",
						},
					],
				};
			}

			const formattedTracks = savedTracks.items
				.map((item: Record<string, unknown>, i: number) => {
					const track = item.track;
					if (!track) return `${i + 1}. [Removed track]`;

					if (isTrack(track)) {
						const artists = track.artists.map((a) => a.name).join(", ");
						const duration = formatDuration(track.duration_ms);
						const addedDate = new Date(item.added_at as string).toLocaleDateString();
						return `${offset + i + 1}. "${track.name}" by ${artists} (${duration}) - ID: ${track.id} - Added: ${addedDate}`;
					}

					return `${i + 1}. Unknown item`;
				})
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `# Your Liked Songs (${offset + 1}-${offset + savedTracks.items.length} of ${savedTracks.total})\n\n${formattedTracks}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting saved tracks:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting saved tracks: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
