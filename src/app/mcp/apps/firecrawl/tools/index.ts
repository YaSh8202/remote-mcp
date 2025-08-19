import { firecrawlBatchScrapeTool } from "./batch-scrape";
import { firecrawlCheckBatchStatusTool } from "./check-batch-status";
import { firecrawlCheckCrawlStatusTool } from "./check-crawl-status";
import { firecrawlCrawlTool } from "./crawl";
import { firecrawlDeepResearchTool } from "./deep-research";
import { firecrawlExtractTool } from "./extract";
import { firecrawlGenerateLlmsTxtTool } from "./generate-llms-txt";
import { firecrawlMapTool } from "./map";
import { firecrawlScrapeTool } from "./scrape";
import { firecrawlSearchTool } from "./search";

export const firecrawlTools = [
	firecrawlScrapeTool,
	firecrawlBatchScrapeTool,
	firecrawlCheckBatchStatusTool,
	firecrawlMapTool,
	firecrawlCrawlTool,
	firecrawlCheckCrawlStatusTool,
	firecrawlSearchTool,
	firecrawlExtractTool,
	firecrawlDeepResearchTool,
	firecrawlGenerateLlmsTxtTool,
];
