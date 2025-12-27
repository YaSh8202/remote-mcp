import { google } from "googleapis";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { formatError, googleDriveAuth } from "../common";
import type { ProcessedSheetData } from "../types";

const readSheetSchema = {
	spreadsheetId: z.string().describe("The ID of the spreadsheet to read"),
	ranges: z
		.array(z.string())
		.optional()
		.describe(
			"Optional array of A1 notation ranges like ['Sheet1!A1:B10']. If not provided, reads entire sheet.",
		),
	sheetId: z
		.number()
		.optional()
		.describe(
			"Optional specific sheet ID to read. If not provided with ranges, reads first sheet.",
		),
};

export const readSheetTool = createParameterizedTool({
	name: "gsheets_read",
	auth: googleDriveAuth,
	description:
		"Read data from a Google Spreadsheet with flexible options for ranges and formatting",
	paramsSchema: readSheetSchema,
	callback: async (args, extra) => {
		try {
			const oauth2Client = new google.auth.OAuth2();
			oauth2Client.setCredentials({
				access_token: extra?.auth?.access_token,
			});

			const sheets = google.sheets({
				version: "v4",
				auth: oauth2Client,
			});

			let response: unknown;

			if (args.ranges) {
				// Read specific ranges
				response = await sheets.spreadsheets.values.batchGet({
					spreadsheetId: args.spreadsheetId,
					ranges: args.ranges,
				});
			} else if (args.sheetId !== undefined) {
				// Get sheet name from sheet ID first
				const metadata = await sheets.spreadsheets.get({
					spreadsheetId: args.spreadsheetId,
					fields: "sheets.properties",
				});

				const sheet = metadata.data.sheets?.find(
					(s) => s.properties?.sheetId === args.sheetId,
				);

				if (!sheet?.properties?.title) {
					throw new Error(`Sheet ID ${args.sheetId} not found`);
				}

				response = await sheets.spreadsheets.values.get({
					spreadsheetId: args.spreadsheetId,
					range: sheet.properties.title,
				});
			} else {
				// Read first sheet by default
				response = await sheets.spreadsheets.values.get({
					spreadsheetId: args.spreadsheetId,
					range: "A:ZZ", // Read all possible columns
				});
			}

			const processedData = await processSheetData(response);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(processedData, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error reading spreadsheet: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

function getA1Notation(row: number, col: number): string {
	let a1 = "";
	let colCopy = col;

	while (colCopy > 0) {
		colCopy--;
		a1 = String.fromCharCode(65 + (colCopy % 26)) + a1;
		colCopy = Math.floor(colCopy / 26);
	}

	return `${a1}${row + 1}`;
}

async function processSheetData(
	response: unknown,
): Promise<ProcessedSheetData[]> {
	const results: ProcessedSheetData[] = [];

	// Handle both single and multiple ranges
	const responseData = response as {
		data: { valueRanges?: unknown[]; values?: unknown[][]; range?: string };
	};
	const valueRanges = responseData.data.valueRanges || [responseData.data];

	for (const range of valueRanges) {
		const rangeData = range as { values?: unknown[][]; range?: string };
		const values = rangeData.values || [];
		if (values.length === 0) continue;

		// Extract sheet name from range
		const rangeParts = rangeData.range?.split("!") || [];
		const sheetName = rangeParts[0]?.replace(/'/g, "") || "Sheet1";

		// Process data with cell locations
		const processedValues = values.map((row: unknown[], rowIndex: number) =>
			row.map((cell: unknown, colIndex: number) => ({
				value: cell,
				location: `${sheetName}!${getA1Notation(rowIndex, colIndex + 1)}`,
			})),
		);

		// Process headers with locations
		const columnHeaders = processedValues[0];
		const data = processedValues.slice(1);

		results.push({
			sheetName,
			data,
			totalRows: values.length,
			totalColumns: columnHeaders.length,
			columnHeaders,
		});
	}

	return results;
}
