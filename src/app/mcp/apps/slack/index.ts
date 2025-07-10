import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { slackAuth } from "./common";
import { slackTools } from "./tools";

export const slackMcpApp = createMcpApp({
	name: "slack",
	displayName: "Slack",
	description: "Slack MCP App for accessing Slack workspaces",
	logo: {
		type: "url",
		url: "https://api.iconify.design/devicon:slack.svg",
	},
	categories: [McpAppCategory.COMMUNICATION],
	auth: slackAuth,
	tools: slackTools,
});
