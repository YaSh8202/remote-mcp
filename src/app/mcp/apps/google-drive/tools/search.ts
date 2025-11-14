import { google } from "googleapis";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { formatError, googleDriveAuth } from "../common";

const searchSchema = {
	query: z.string().describe("Search query"),
	pageToken: z
		.string()
		.optional()
		.describe("Token for the next page of results"),
	pageSize: z
		.number()
		.optional()
		.describe("Number of results per page (max 100)"),
};

export const searchTool = createParameterizedTool({
	name: "gdrive_search",
	auth: googleDriveAuth,
	description: "Search for files in Google Drive",
	paramsSchema: searchSchema,
	callback: async (args, extra) => {
		try {
			const oauth2Client = new google.auth.OAuth2();
			oauth2Client.setCredentials({
				access_token: extra?.auth?.access_token,
			});

			const drive = google.drive({
				version: "v3",
				auth: oauth2Client,
			});

			const userQuery = args.query.trim();
			let searchQuery = "";

			// If query is empty, list all files
			if (!userQuery) {
				searchQuery = "trashed = false";
			} else {
				// Escape special characters in the query
				const escapedQuery = userQuery
					.replace(/\\/g, "\\\\")
					.replace(/'/g, "\\'");

				// Build search query with multiple conditions
				const conditions = [];

				// Search in title
				conditions.push(`name contains '${escapedQuery}'`);

				// If specific file type is mentioned in query, add mimeType condition
				if (userQuery.toLowerCase().includes("sheet")) {
					conditions.push(
						"mimeType = 'application/vnd.google-apps.spreadsheet'",
					);
				}

				searchQuery = `(${conditions.join(" or ")}) and trashed = false`;
			}

			const res = await drive.files.list({
				q: searchQuery,
				pageSize: args.pageSize || 10,
				pageToken: args.pageToken,
				orderBy: "modifiedTime desc",
				fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
			});

			const fileList = res.data.files
				?.map((file) => `${file.id} ${file.name} (${file.mimeType})`)
				.join("\n");

			let response = `Found ${res.data.files?.length ?? 0} files:\n${fileList}`;

			// Add pagination info if there are more results
			if (res.data.nextPageToken) {
				response += `\n\nMore results available. Use pageToken: ${res.data.nextPageToken}`;
			}

			return {
				content: [
					{
						type: "text",
						text: response,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error searching Google Drive: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
