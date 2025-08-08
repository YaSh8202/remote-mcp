import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { atlassianAuth } from "./common";
import { atlassianTools } from "./tools";

export const atlassianMcpApp = createMcpApp({
	name: "atlassian",
	displayName: "Atlassian",
	description: "Atlassian MCP App for Jira and Confluence",
	logo: {
		type: "url",
		url: "https://api.iconify.design/logos:atlassian.svg",
	},
	categories: [McpAppCategory.PRODUCTIVITY, McpAppCategory.DEVELOPER_TOOLS],
	auth: atlassianAuth,
	tools: atlassianTools,
});
