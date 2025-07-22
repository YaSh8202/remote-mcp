import { McpAppAuth, OAuth2AuthorizationMethod } from "../../mcp-app/property";

// Helper function to format error responses
export function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

// Notion OAuth2 configuration for API access
export const notionAuth = McpAppAuth.OAuth2({
	required: true,
	authUrl: "https://api.notion.com/v1/oauth/authorize",
	tokenUrl: "https://api.notion.com/v1/oauth/token",
	scope: [],
	authorizationMethod: OAuth2AuthorizationMethod.HEADER,
});

// Common ID description for Notion objects
export const commonIdDescription = 
	" Note: when copying Notion IDs, remove any dashes (-) or encode as needed for the API.";

// Format parameter for response type
export const formatParameter = {
	type: "string" as const,
	enum: ["json", "markdown"],
	description: 'Response format. Use "markdown" for human-readable output, "json" for programmatic access.',
	default: "markdown",
};
