import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { firecrawlAuth } from "./common";
import { firecrawlTools } from "./tools";

export const firecrawlMcpApp = createMcpApp({
	name: "firecrawl",
	displayName: "Firecrawl",
	description:
		"Firecrawl MCP App - A comprehensive web scraping and crawling solution with advanced features including single page scraping, batch processing, website mapping, web search, structured data extraction, and deep research capabilities using the Firecrawl API",
	logo: {
		type: "url",
		url: "/assets/firecrawl-logo.png",
	},
	categories: [
		McpAppCategory.DEVELOPER_TOOLS,
		McpAppCategory.PRODUCTIVITY,
		McpAppCategory.SEARCH,
	],
	auth: firecrawlAuth,
	tools: firecrawlTools,
});
