import { analyzeWorkloadIndexesTool, getTopQueriesTool } from "./analysis";
import { executeSqlTool, explainQueryTool } from "./execute";
import { analyzeDbHealthTool } from "./health";
import {
	getObjectDetailsTool,
	listObjectsTool,
	listSchemasTool,
} from "./schema";

export const postgresTools = [
	// Schema exploration tools
	listSchemasTool,
	listObjectsTool,
	getObjectDetailsTool,

	// SQL execution tools
	executeSqlTool,
	explainQueryTool,

	// Health and monitoring tools
	analyzeDbHealthTool,

	// Query analysis tools
	getTopQueriesTool,
	analyzeWorkloadIndexesTool,
];
