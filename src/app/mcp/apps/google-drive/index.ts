import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { googleDriveAuth } from "./common";
import { googleDriveTools } from "./tools";

export const googleDriveMcpApp = createMcpApp({
	name: "google-drive",
	displayName: "Google Drive",
	description:
		"Google Drive and Google Sheets MCP App - Search, read files, and manage spreadsheets",
	logo: {
		type: "url",
		url: "https://api.iconify.design/logos:google-drive.svg",
	},
	categories: [McpAppCategory.PRODUCTIVITY],
	auth: googleDriveAuth,
	tools: googleDriveTools,
});
