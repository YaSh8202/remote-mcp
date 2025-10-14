import { McpAppAuth } from "../../mcp-app/property";

// Helper function to format error responses
export function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

export const linearAuth = McpAppAuth.SecretText({
	required: true,
	displayName: "Linear API Key",
	description:
		"Your Linear API key. You can create one at https://linear.app/settings/api",
});
