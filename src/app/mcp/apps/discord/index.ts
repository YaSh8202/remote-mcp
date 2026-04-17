import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { discordAuth } from "./common";
import { discordTools } from "./tools";

export const discordMcpApp = createMcpApp({
	name: "discord",
	displayName: "Discord",
	description:
		"Discord MCP App for reading messages, listing channels, and sending messages in Discord guilds via a bot token.",
	logo: {
		type: "url",
		url: "https://api.iconify.design/logos:discord-icon.svg",
	},
	categories: [McpAppCategory.COMMUNICATION],
	auth: discordAuth,
	tools: discordTools,
});
