import { createMcpApp } from "@/app/mcp/mcp-app";
import { McpAppCategory } from "@/app/mcp/mcp-app/app-metadata";
import { youtubeAuth } from "./common";
import { youtubeTools } from "./tools/index";

export const youtubeMcpApp = createMcpApp({
	name: "youtube",
	displayName: "YouTube",
	description:
		"YouTube MCP App - Manage videos, playlists, channels, transcripts, and analytics",
	logo: {
		type: "url",
		url: "https://api.iconify.design/logos:youtube-icon.svg",
	},
	categories: [McpAppCategory.ENTERTAINMENT, McpAppCategory.DEVELOPER_TOOLS],
	auth: youtubeAuth,
	tools: youtubeTools,
});
