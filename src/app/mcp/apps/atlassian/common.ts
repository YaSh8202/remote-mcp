import { McpAppAuth } from "../../mcp-app/property";

// Helper function to format error responses
export function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

// Atlassian OAuth2 configuration
export const atlassianAuth = McpAppAuth.OAuth2({
	required: true,
	authUrl: "https://auth.atlassian.com/authorize",
	tokenUrl: "https://auth.atlassian.com/oauth/token",
	scope: [
		"read:jira-work",
		"write:jira-work",
		"read:jira-user",
		"read:confluence-content.all",
		"write:confluence-content",
		"read:confluence-content.summary",
		"read:account",
		"read:me",
		"offline_access",
	],
});
