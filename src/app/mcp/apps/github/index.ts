import { McpApp, McpAppCategory } from "../../mcp-app";
import { MCPAppAuthType } from "../../mcp-app/auth";
import { githubTools } from "./tools";

export const githubMcpApp = new McpApp(
	"github",
	"GitHub MCP App",
	[McpAppCategory.DEVELOPER_TOOLS],
	{
		required: true,
		authUrl: "https://github.com/login/oauth/authorize",
		tokenUrl: "https://github.com/login/oauth/access_token",
		scope: ["admin:repo_hook", "admin:org", "repo"],
		access_token: "",
		data: {},
		type: MCPAppAuthType.OAUTH2,
		extra: {},
	},
	githubTools,
);
