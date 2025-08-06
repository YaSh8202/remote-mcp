import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { postgresAuth } from "./common";
import { postgresTools } from "./tools";

export const postgresMcpApp = createMcpApp({
	name: "postgres",
	displayName: "PostgreSQL",
	description:
		"PostgreSQL database management and analysis tools for schema exploration, SQL execution, health monitoring, and query optimization",
	logo: {
		type: "url",
		url: "https://api.iconify.design/logos:postgresql.svg",
	},
	categories: [McpAppCategory.DEVELOPER_TOOLS, McpAppCategory.PRODUCTIVITY],
	auth: postgresAuth,
	tools: postgresTools,
});
