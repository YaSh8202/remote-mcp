import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { spotifyAuth } from "./common";
import { spotifyTools } from "./tools";

export const spotifyMcpApp = createMcpApp({
	name: "spotify",
	displayName: "Spotify",
	description:
		"Spotify MCP App - Control playback, manage playlists, and discover music",
	logo: {
		type: "url",
		url: "https://api.iconify.design/logos:spotify-icon.svg",
	},
	categories: [McpAppCategory.COMMUNICATION],
	auth: spotifyAuth,
	tools: spotifyTools,
});
