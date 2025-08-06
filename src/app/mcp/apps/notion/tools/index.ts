// Export all Notion MCP tools

// Block tools
export {
	appendBlockChildrenTool,
	retrieveBlockTool,
	retrieveBlockChildrenTool,
	deleteBlockTool,
	updateBlockTool,
} from "./blocks";

// Page tools
export {
	retrievePageTool,
	updatePagePropertiesTool,
} from "./pages";

// User tools
export {
	listAllUsersTool,
	retrieveUserTool,
	retrieveBotUserTool,
} from "./users";

// Database tools
export {
	createDatabaseTool,
	queryDatabaseTool,
	retrieveDatabaseTool,
	updateDatabaseTool,
	createDatabaseItemTool,
} from "./databases";

// Comment tools
export {
	createCommentTool,
	retrieveCommentsTool,
} from "./comments";

// Search tools
export { searchTool } from "./search";

// Import tools for the array
import {
	appendBlockChildrenTool,
	deleteBlockTool,
	retrieveBlockChildrenTool,
	retrieveBlockTool,
	updateBlockTool,
} from "./blocks";

import { retrievePageTool, updatePagePropertiesTool } from "./pages";

import {
	listAllUsersTool,
	retrieveBotUserTool,
	retrieveUserTool,
} from "./users";

import {
	createDatabaseItemTool,
	createDatabaseTool,
	queryDatabaseTool,
	retrieveDatabaseTool,
	updateDatabaseTool,
} from "./databases";

import { createCommentTool, retrieveCommentsTool } from "./comments";

import { searchTool } from "./search";

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
