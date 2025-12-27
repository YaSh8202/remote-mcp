// Jira tools

// Confluence tools
import {
	addPageCommentTool,
	createPageTool,
	getCommentsTool,
	getPageChildrenTool,
	getPageTool,
	searchConfluenceTool,
	updatePageTool,
} from "./confluence";
// Context tools
import { getAccessibleResourcesTool, getAtlassianUserTool } from "./context";
import {
	addCommentTool,
	addWorklogTool,
	createIssueTool,
	getAllProjectsAutoTool,
	getAllProjectsTool,
	getIssueTool,
	getTransitionsTool,
	getUserProfileTool,
	searchIssuesTool,
	transitionIssueTool,
	updateIssueTool,
} from "./jira";

export const atlassianTools = [
	// Context tools
	getAtlassianUserTool,
	getAccessibleResourcesTool,

	// Jira tools
	getIssueTool,
	searchIssuesTool,
	createIssueTool,
	updateIssueTool,
	transitionIssueTool,
	addCommentTool,
	getUserProfileTool,
	getAllProjectsTool,
	getAllProjectsAutoTool,
	getTransitionsTool,
	addWorklogTool,

	// Confluence tools
	searchConfluenceTool,
	getPageTool,
	createPageTool,
	updatePageTool,
	getPageChildrenTool,
	getCommentsTool,
	addPageCommentTool,
];
