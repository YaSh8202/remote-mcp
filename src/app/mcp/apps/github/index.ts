import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { McpAppAuth } from "../../mcp-app/property";
import { githubTools } from "./tools";

export const githubAuth = McpAppAuth.OAuth2({
	required: true,
	authUrl: "https://github.com/login/oauth/authorize",
	tokenUrl: "https://github.com/login/oauth/access_token",
	scope: ["admin:repo_hook", "admin:org", "repo"],
});

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
