import { z } from "zod";
import { createParameterizedTool } from "../../mcp-app/tools";
import { fetchHtml, fetchJson, fetchMarkdown, fetchTxt } from "./fetcher";
import { RequestPayloadSchema } from "./types";

// Helper function to format errors for MCP responses
const formatErrorResponse = (error: Error) => ({
	content: [
		{
			type: "text" as const,
			text: `Error: ${error.message}${error.cause ? ` - ${error.cause}` : ""}`,
		},
	],
	isError: true,
});

// Common schema for all fetch tools
const fetchSchema = {
	url: z.string().url().describe("URL of the website to fetch"),
	headers: z
		.record(z.string())
		.optional()
		.describe("Optional headers to include in the request"),
	max_length: z
		.number()
		.int()
		.min(1)
		.optional()
		.default(5000)
		.describe("Maximum number of characters to return (default: 5000)"),
	start_index: z
		.number()
		.int()
		.min(0)
		.optional()
		.default(0)
		.describe("Start content from this character index (default: 0)"),
};

// Fetch HTML tool
const fetchHtmlTool = createParameterizedTool({
	name: "fetch_html",
	auth: undefined,
	description: "Fetch a website and return the content as HTML",
	paramsSchema: fetchSchema,
	callback: async (args, _extra) => {
		try {
			const validatedArgs = RequestPayloadSchema.parse(args);
			const result = await fetchHtml(validatedArgs);
			if (result.isError) {
				return formatErrorResponse(new Error(result.content[0].text));
			}
			return {
				content: result.content,
			};
		} catch (error) {
			console.error("Error in fetch_html:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

// Fetch JSON tool
const fetchJsonTool = createParameterizedTool({
	name: "fetch_json",
	auth: undefined,
	description: "Fetch a JSON file from a URL",
	paramsSchema: fetchSchema,
	callback: async (args, _extra) => {
		try {
			const validatedArgs = RequestPayloadSchema.parse(args);
			const result = await fetchJson(validatedArgs);
			if (result.isError) {
				return formatErrorResponse(new Error(result.content[0].text));
			}
			return {
				content: result.content,
			};
		} catch (error) {
			console.error("Error in fetch_json:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

// Fetch plain text tool
const fetchTxtTool = createParameterizedTool({
	name: "fetch_txt",
	auth: undefined,
	description: "Fetch a website and return the content as plain text (no HTML)",
	paramsSchema: fetchSchema,
	callback: async (args, _extra) => {
		try {
			const validatedArgs = RequestPayloadSchema.parse(args);
			const result = await fetchTxt(validatedArgs);
			if (result.isError) {
				return formatErrorResponse(new Error(result.content[0].text));
			}
			return {
				content: result.content,
			};
		} catch (error) {
			console.error("Error in fetch_txt:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

// Fetch markdown tool
const fetchMarkdownTool = createParameterizedTool({
	name: "fetch_markdown",
	auth: undefined,
	description: "Fetch a website and return the content as Markdown",
	paramsSchema: fetchSchema,
	callback: async (args, _extra) => {
		try {
			const validatedArgs = RequestPayloadSchema.parse(args);
			const result = await fetchMarkdown(validatedArgs);
			if (result.isError) {
				return formatErrorResponse(new Error(result.content[0].text));
			}
			return {
				content: result.content,
			};
		} catch (error) {
			console.error("Error in fetch_markdown:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

export const fetchTools = [
	fetchHtmlTool,
	fetchJsonTool,
	fetchTxtTool,
	fetchMarkdownTool,
];
