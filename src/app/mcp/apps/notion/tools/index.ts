// Export all Notion MCP tools

// Block tools
export {
	appendBlockChildrenTool,
	deleteBlockTool,
	retrieveBlockChildrenTool,
	retrieveBlockTool,
	updateBlockTool,
} from "./blocks";
// Comment tools
export {
	createCommentTool,
	retrieveCommentsTool,
} from "./comments";
// Database tools
export {
	createDatabaseItemTool,
	createDatabaseTool,
	queryDatabaseTool,
	retrieveDatabaseTool,
	updateDatabaseTool,
} from "./databases";
// Page tools
export {
	retrievePageTool,
	updatePagePropertiesTool,
} from "./pages";
// Search tools
export { searchTool } from "./search";
// User tools
export {
	listAllUsersTool,
	retrieveBotUserTool,
	retrieveUserTool,
} from "./users";

// Import tools for the array
import {
	appendBlockChildrenTool,
	deleteBlockTool,
	retrieveBlockChildrenTool,
	retrieveBlockTool,
	updateBlockTool,
} from "./blocks";
import { createCommentTool, retrieveCommentsTool } from "./comments";
import {
	createDatabaseItemTool,
	createDatabaseTool,
	queryDatabaseTool,
	retrieveDatabaseTool,
	updateDatabaseTool,
} from "./databases";
import { retrievePageTool, updatePagePropertiesTool } from "./pages";
import { searchTool } from "./search";
import {
	listAllUsersTool,
	retrieveBotUserTool,
	retrieveUserTool,
} from "./users";

// All tools array for easy importing
export const notionTools = [
	// Block operations
	appendBlockChildrenTool,
	retrieveBlockTool,
	retrieveBlockChildrenTool,
	deleteBlockTool,
	updateBlockTool,

	// Page operations
	retrievePageTool,
	updatePagePropertiesTool,

	// User operations
	listAllUsersTool,
	retrieveUserTool,
	retrieveBotUserTool,

	// Database operations
	createDatabaseTool,
	queryDatabaseTool,
	retrieveDatabaseTool,
	updateDatabaseTool,
	createDatabaseItemTool,

	// Comment operations
	createCommentTool,
	retrieveCommentsTool,

	// Search operations
	searchTool,
];
