import { McpAppAuth } from "../../mcp-app/property";

export const postgresAuth = McpAppAuth.SecretText({
	displayName: "PostgreSQL Database URI",
	description: "Enter your PostgreSQL database connection string (e.g., postgresql://username:password@host:port/database). Ensure the user has appropriate read/write permissions based on your needs.",
	required: true,
});

// Helper function to format error responses for PostgreSQL operations
export const formatPostgresError = (error: Error) => ({
	content: [
		{
			type: "text" as const,
			text: `PostgreSQL Error: ${error.message}`,
		},
	],
	isError: true,
});
