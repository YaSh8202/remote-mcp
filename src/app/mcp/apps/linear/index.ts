import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { linearAuth } from "./common";
import { linearTools } from "./tools";

export const linearMcpApp = createMcpApp({
	name: "linear",
	displayName: "Linear",
	description:
		"Linear MCP App for managing issues, tracking work, and coordinating with teams",
	logo: {
		type: "icon",
		icon: "linear",
	},
	categories: [McpAppCategory.DEVELOPER_TOOLS, McpAppCategory.PRODUCTIVITY],
	auth: linearAuth,
	tools: linearTools,
});
