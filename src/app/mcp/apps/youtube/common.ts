import { McpAppAuth } from "../../mcp-app/property";

export const youtubeAuth = McpAppAuth.SecretText({
	displayName: "YouTube API Key",
	description: "Enter your YouTube API key to connect to the YouTube API.",
	required: true,
});
