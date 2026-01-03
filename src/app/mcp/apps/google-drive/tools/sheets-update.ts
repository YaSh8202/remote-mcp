import { google } from "googleapis";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { formatError, googleDriveAuth } from "../common";

const updateCellSchema = {
	fileId: z.string().describe("ID of the spreadsheet"),
	range: z.string().describe("Cell range in A1 notation (e.g. 'Sheet1!A1')"),
	value: z.string().describe("New cell value"),
};

export const updateCellTool = createParameterizedTool({
	name: "gsheets_update_cell",
	auth: googleDriveAuth,
	description: "Update a cell value in a Google Spreadsheet",
	paramsSchema: updateCellSchema,
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

			await sheets.spreadsheets.values.update({
				spreadsheetId: args.fileId,
				range: args.range,
				valueInputOption: "RAW",
				requestBody: {
					values: [[args.value]],
				},
			});

			return {
				content: [
					{
						type: "text",
						text: `Updated cell ${args.range} to value: ${args.value}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error updating cell: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
