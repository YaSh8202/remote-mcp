import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { youtubeAuth } from "./common";
import { youtubeTools } from "./tools";

export const youtubeMcpApp = createMcpApp({
	name: "youtube",
	displayName: "YouTube",
	description: "YouTube MCP App - Manage videos, playlists, and content",
	logo: {
		type: "url",
		url: "https://api.iconify.design/logos:youtube-icon.svg",
	},
	categories: [McpAppCategory.PRODUCTIVITY],
	auth: youtubeAuth,
	tools: youtubeTools,
});
