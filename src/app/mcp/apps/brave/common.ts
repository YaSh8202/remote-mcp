import { McpAppAuth } from "../../mcp-app/property";

export const braveAuth = McpAppAuth.SecretText({
	displayName: "Brave Search API Key",
	description: "Enter your Brave Search API key to connect to the Brave Search API. Get your API key from https://brave.com/search/api/",
	required: true,
});
