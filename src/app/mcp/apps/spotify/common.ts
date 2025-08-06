import { McpAppAuth } from "../../mcp-app/property";

// Helper function to format error responses
export function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

// Helper function to format duration from milliseconds to MM:SS format
export function formatDuration(ms: number): string {
	const minutes = Math.floor(ms / 60000);
	const seconds = ((ms % 60000) / 1000).toFixed(0);
	return `${minutes}:${seconds.padStart(2, "0")}`;
}

// Spotify OAuth2 configuration
export const spotifyAuth = McpAppAuth.OAuth2({
	required: true,
	authUrl: "https://accounts.spotify.com/authorize",
	tokenUrl: "https://accounts.spotify.com/api/token",
	scope: [
		"user-read-private",
		"user-read-email",
		"user-read-playback-state",
		"user-modify-playback-state",
		"user-read-currently-playing",
		"playlist-read-private",
		"playlist-modify-private",
		"playlist-modify-public",
		"user-library-read",
		"user-library-modify",
		"user-read-recently-played",
		"user-top-read",
		"user-follow-read",
		"user-follow-modify",
	],
});

// Spotify API Base URL
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Helper function to make authenticated Spotify API requests
export async function makeSpotifyRequest(
	endpoint: string,
	accessToken: string,
	options: RequestInit = {},
): Promise<Response> {
	const url = endpoint.startsWith("http")
		? endpoint
		: `${SPOTIFY_API_BASE}${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(
			`Spotify API error: ${response.status} ${response.statusText} - ${errorData}`,
		);
	}

	return response;
}

// Helper function to check if track object is valid
export function isTrack(item: unknown): item is SpotifyTrack {
	if (!item || typeof item !== "object" || item === null) {
		return false;
	}

	const obj = item as Record<string, unknown>;

	return (
		obj.type === "track" &&
		Array.isArray(obj.artists) &&
		typeof obj.album === "object" &&
		obj.album !== null &&
		typeof (obj.album as Record<string, unknown>).name === "string"
	);
}

// Spotify type interfaces
export interface SpotifyArtist {
	id: string;
	name: string;
}

export interface SpotifyAlbum {
	id: string;
	name: string;
	artists: SpotifyArtist[];
}

export interface SpotifyTrack {
	id: string;
	name: string;
	type: string;
	duration_ms: number;
	artists: SpotifyArtist[];
	album: SpotifyAlbum;
}
