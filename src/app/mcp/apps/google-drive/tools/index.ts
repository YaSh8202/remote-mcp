import { readFileTool } from "./files";
import { searchTool } from "./search";
import { readSheetTool } from "./sheets-read";
import { updateCellTool } from "./sheets-update";

export const googleDriveTools = [
	// File management tools
	searchTool,
	readFileTool,

	// Google Sheets tools
	readSheetTool,
	updateCellTool,
];
