import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { discordAuth } from "./common";
import { discordTools } from "./tools";

export const discordMcpApp = createMcpApp({
	name: "discord",
	displayName: "Discord",
	description: "Discord MCP App for accessing Discord servers and channels",
	logo: {
		type: "url",
		url: "https://api.iconify.design/logos:discord-icon.svg",
	},
	categories: [McpAppCategory.COMMUNICATION],
	auth: discordAuth,
	tools: discordTools,
});
