import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { McpAppAuth } from "../../mcp-app/property";
import { gitlabTools } from "./tools";

export const gitlabAuth = McpAppAuth.OAuth2({
	required: true,
	authUrl: "https://gitlab.com/oauth/authorize",
	tokenUrl: "https://gitlab.com/oauth/token",
	scope: ["api", "read_user"],
});

export const gitlabMcpApp = createMcpApp({
	name: "gitlab",
	displayName: "Gitlab",
	description: "Gitlab MCP App",
	logo: {
		type: "url",
		url: "https://api.iconify.design/vscode-icons:file-type-gitlab.svg",
	},
	auth: gitlabAuth,
	tools: gitlabTools,
	categories: [McpAppCategory.DEVELOPER_TOOLS],
});
