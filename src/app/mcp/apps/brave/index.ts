import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { braveAuth } from "./common";
import { braveTools } from "./tools";

export const braveMcpApp = createMcpApp({
	name: "brave",
	displayName: "Brave Search",
	description:
		"Brave Search MCP App - Perform web searches, image searches, news searches, video searches, and local business searches using the Brave Search API",
	logo: {
		type: "url",
		url: "https://api.iconify.design/logos:brave.svg",
	},
	categories: [McpAppCategory.SEARCH, McpAppCategory.PRODUCTIVITY],
	auth: braveAuth,
	tools: braveTools,
});
