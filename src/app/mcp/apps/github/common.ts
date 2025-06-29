import { McpAppAuth } from "../../mcp-app/property";

// Helper function to format error responses
export function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

export const githubAuth = McpAppAuth.OAuth2({
	required: true,
	authUrl: "https://github.com/login/oauth/authorize",
	tokenUrl: "https://github.com/login/oauth/access_token",
	scope: ["admin:repo_hook", "admin:org", "repo"],
});
