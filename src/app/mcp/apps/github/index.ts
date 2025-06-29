import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { githubAuth } from "./common";
import { githubTools } from "./tools";

export const githubMcpApp = createMcpApp({
	name: "github",
	displayName: "Github",
	description: "Github MCP App",
	logo: {
		type: "icon",
		icon: "github",
	},
	categories: [McpAppCategory.DEVELOPER_TOOLS],
	auth: githubAuth,
	tools: githubTools,
});
