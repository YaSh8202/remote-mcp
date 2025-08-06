import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { notionAuth } from "./common";
import { notionTools } from "./tools";

export const notionMcpApp = createMcpApp({
	name: "notion",
	displayName: "Notion",
	description:
		"Notion MCP App - Interact with Notion workspaces, databases, pages, and content using OAuth2 authentication",
	logo: {
		type: "icon",
		icon: "notion",
	},
	categories: [McpAppCategory.PRODUCTIVITY, McpAppCategory.COMMUNICATION],
	auth: notionAuth,
	tools: notionTools,
});
