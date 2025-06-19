import { McpApp, McpAppCategory } from "../../mcp-app";
import { MCPAppAuthType, type McpAppAuthProperty } from "../../mcp-app/auth";
import { githubTools } from "./tools";

export const githubMcpApp = new McpApp(
	"github",
	"GitHub MCP App",
	{
		type: "icon",
		icon: "github",
	},
	[McpAppCategory.DEVELOPER_TOOLS],
	{
		required: true,
		authUrl: "https://github.com/login/oauth/authorize",
		tokenUrl: "https://github.com/login/oauth/access_token",
		scope: ["admin:repo_hook", "admin:org", "repo"],
		type: MCPAppAuthType.OAUTH2,
		extra: {},
	} as McpAppAuthProperty,
	githubTools,
);
