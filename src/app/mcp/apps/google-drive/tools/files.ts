import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { google } from "googleapis";
import { z } from "zod";
import { formatError, googleDriveAuth } from "../common";
import type { FileContent } from "../types";

const readFileSchema = {
	fileId: z.string().describe("ID of the file to read"),
};

export const readFileTool = createParameterizedTool({
	name: "gdrive_read_file",
	auth: googleDriveAuth,
	description: "Read contents of a file from Google Drive",
	paramsSchema: readFileSchema,
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

			const result = await readGoogleDriveFile(drive, args.fileId);

			return {
				content: [
					{
						type: "text",
						text: `Contents of ${result.name}:\n\n${result.contents.text || result.contents.blob}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error reading file: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

async function readGoogleDriveFile(
	drive: ReturnType<typeof google.drive>,
	fileId: string,
): Promise<{ name: string; contents: FileContent }> {
	// First get file metadata to check mime type
	const file = await drive.files.get({
		fileId,
		fields: "mimeType,name",
	});

	// For Google Docs/Sheets/etc we need to export
	if (file.data.mimeType?.startsWith("application/vnd.google-apps")) {
		let exportMimeType: string;
		switch (file.data.mimeType) {
			case "application/vnd.google-apps.document":
				exportMimeType = "text/markdown";
				break;
			case "application/vnd.google-apps.spreadsheet":
				exportMimeType = "text/csv";
				break;
			case "application/vnd.google-apps.presentation":
				exportMimeType = "text/plain";
				break;
			case "application/vnd.google-apps.drawing":
				exportMimeType = "image/png";
				break;
			default:
				exportMimeType = "text/plain";
		}

		const res = await drive.files.export(
			{ fileId, mimeType: exportMimeType },
			{ responseType: "text" },
		);

		return {
			name: file.data.name || fileId,
			contents: {
				mimeType: exportMimeType,
				text: res.data as string,
			},
		};
	}

	// For regular files download content
	const res = await drive.files.get(
		{ fileId, alt: "media" },
		{ responseType: "arraybuffer" },
	);
	const mimeType = file.data.mimeType || "application/octet-stream";
	const isText =
		mimeType.startsWith("text/") || mimeType === "application/json";
	const content = Buffer.from(res.data as ArrayBuffer);

	return {
		name: file.data.name || fileId,
		contents: {
			mimeType,
			...(isText
				? { text: content.toString("utf-8") }
				: { blob: content.toString("base64") }),
		},
	};
}
