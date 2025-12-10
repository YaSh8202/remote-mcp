import { McpAppAuth } from "../../mcp-app/property";

export const discordAuth = McpAppAuth.OAuth2({
	description: "Connect to Discord to send messages and manage channels",
	authUrl: "https://discord.com/api/oauth2/authorize",
	tokenUrl: "https://discord.com/api/oauth2/token",
	required: true,
	scope: ["bot", "messages.read", "guilds", "guilds.members.read", "identify"],
});
