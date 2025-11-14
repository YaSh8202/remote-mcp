import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import {
	formatDuration,
	formatError,
	makeSpotifyRequest,
	spotifyAuth,
} from "../common";

// Get albums tool
const getAlbumsSchema = {
	albumIds: z
		.union([z.string(), z.array(z.string()).max(20)])
		.describe("A single album ID or array of album IDs (max 20)"),
};

export const getAlbumsTool = createParameterizedTool({
	name: "getAlbums",
	auth: spotifyAuth,
	description:
		"Get detailed information about one or more albums by their Spotify IDs",
	paramsSchema: getAlbumsSchema,
	callback: async (args, extra) => {
		try {
			const { albumIds } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const ids = Array.isArray(albumIds) ? albumIds : [albumIds];

			if (ids.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Error: No album IDs provided",
						},
					],
				};
			}

			const response = await makeSpotifyRequest(
				`/albums?ids=${ids.join(",")}`,
				accessToken,
			);

			const albumsData = await response.json();
			const albums = albumsData.albums;

			if (albums.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "No albums found for the provided IDs",
						},
					],
				};
			}

			if (albums.length === 1) {
				const album = albums[0];
				const artists = album.artists
					.map((a: Record<string, unknown>) => a.name)
					.join(", ");
				const releaseDate = album.release_date;
				const totalTracks = album.total_tracks;
				const albumType = album.album_type;

				return {
					content: [
						{
							type: "text" as const,
							text: `# Album Details\n\n**Name:** "${album.name}"\n**Artists:** ${artists}\n**Release Date:** ${releaseDate}\n**Type:** ${albumType}\n**Total Tracks:** ${totalTracks}\n**ID:** ${album.id}`,
						},
					],
				};
			}

			// Multiple albums - show summary list
			const formattedAlbums = albums
				.map((album: Record<string, unknown>, i: number) => {
					const artists = (album.artists as Array<Record<string, unknown>>)
						.map((a) => a.name)
						.join(", ");
					return `${i + 1}. "${album.name}" by ${artists} (${album.release_date}) - ID: ${album.id}`;
				})
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `# Albums\n\n${formattedAlbums}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting albums:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting albums: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get album tracks tool
const getAlbumTracksSchema = {
	albumId: z.string().describe("The Spotify ID of the album"),
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

export const getAlbumTracksTool = createParameterizedTool({
	name: "getAlbumTracks",
	auth: spotifyAuth,
	description: "Get tracks from a specific album with pagination support",
	paramsSchema: getAlbumTracksSchema,
	callback: async (args, extra) => {
		try {
			const { albumId, limit = 20, offset = 0 } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			const response = await makeSpotifyRequest(
				`/albums/${albumId}/tracks?limit=${limit}&offset=${offset}`,
				accessToken,
			);

			const tracks = await response.json();

			if (tracks.items.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "No tracks found in this album",
						},
					],
				};
			}

			const formattedTracks = tracks.items
				.map((track: Record<string, unknown>, i: number) => {
					if (!track) return `${i + 1}. [Track not found]`;

					const artists = (track.artists as Array<Record<string, unknown>>)
						.map((a) => a.name)
						.join(", ");
					const duration = formatDuration(track.duration_ms as number);
					return `${offset + i + 1}. "${track.name}" by ${artists} (${duration}) - ID: ${track.id}`;
				})
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `# Album Tracks (${offset + 1}-${offset + tracks.items.length} of ${tracks.total})\n\n${formattedTracks}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting album tracks:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting album tracks: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Save or remove albums tool
const saveOrRemoveAlbumsSchema = {
	albumIds: z
		.array(z.string())
		.max(20)
		.describe("Array of Spotify album IDs (max 20)"),
	action: z
		.enum(["save", "remove"])
		.describe("Action to perform: save or remove albums"),
};

export const saveOrRemoveAlbumsTool = createParameterizedTool({
	name: "saveOrRemoveAlbumsForUser",
	auth: spotifyAuth,
	description: 'Save or remove albums from the user\'s "Your Music" library',
	paramsSchema: saveOrRemoveAlbumsSchema,
	callback: async (args, extra) => {
		try {
			const { albumIds, action } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			if (albumIds.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Error: No album IDs provided",
						},
					],
				};
			}

			const endpoint = action === "save" ? "/me/albums" : "/me/albums";
			const method = action === "save" ? "PUT" : "DELETE";

			await makeSpotifyRequest(endpoint, accessToken, {
				method,
				body: JSON.stringify({ ids: albumIds }),
			});

			const actionPastTense = action === "save" ? "saved" : "removed";
			const preposition = action === "save" ? "to" : "from";

			return {
				content: [
					{
						type: "text" as const,
						text: `Successfully ${actionPastTense} ${albumIds.length} album${albumIds.length === 1 ? "" : "s"} ${preposition} your library`,
					},
				],
			};
		} catch (error) {
			console.error(
				`Error ${args.action === "save" ? "saving" : "removing"} albums:`,
				error,
			);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error ${args.action === "save" ? "saving" : "removing"} albums: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Check saved albums tool
const checkSavedAlbumsSchema = {
	albumIds: z
		.array(z.string())
		.max(20)
		.describe("Array of Spotify album IDs to check (max 20)"),
};

export const checkSavedAlbumsTool = createParameterizedTool({
	name: "checkUsersSavedAlbums",
	auth: spotifyAuth,
	description: 'Check if albums are saved in the user\'s "Your Music" library',
	paramsSchema: checkSavedAlbumsSchema,
	callback: async (args, extra) => {
		try {
			const { albumIds } = args;
			const accessToken = extra?.auth?.access_token;

			if (!accessToken) {
				throw new Error("No access token available");
			}

			if (albumIds.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Error: No album IDs provided",
						},
					],
				};
			}

			const response = await makeSpotifyRequest(
				`/me/albums/contains?ids=${albumIds.join(",")}`,
				accessToken,
			);

			const savedStatus = await response.json();

			const formattedResults = albumIds
				.map((albumId, i) => {
					const isSaved = savedStatus[i];
					return `${i + 1}. ${albumId}: ${isSaved ? "Saved" : "Not saved"}`;
				})
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `# Album Save Status\n\n${formattedResults}`,
					},
				],
			};
		} catch (error) {
			console.error("Error checking saved albums:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error checking saved albums: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
