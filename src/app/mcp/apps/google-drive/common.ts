import { McpAppAuth } from "../../mcp-app/property";

// Helper function to format error responses
export function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

export const googleDriveAuth = McpAppAuth.OAuth2({
	required: true,
	authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
	tokenUrl: "https://oauth2.googleapis.com/token",
	scope: [
		"https://www.googleapis.com/auth/drive.readonly",
		"https://www.googleapis.com/auth/spreadsheets",
	],
});
