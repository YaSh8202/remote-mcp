import { addCommentTool } from "./add-comment";
import { createIssueTool } from "./create-issue";
import { getUserIssuesTool } from "./get-user-issues";
import { searchIssuesTool } from "./search-issues";
import { updateIssueTool } from "./update-issue";

export const linearTools = [
	createIssueTool,
	updateIssueTool,
	searchIssuesTool,
	getUserIssuesTool,
	addCommentTool,
];
