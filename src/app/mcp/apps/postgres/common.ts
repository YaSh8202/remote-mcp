import { McpAppAuth } from "../../mcp-app/property";
import { PostgreSQLClient, validateConnectionString } from "./client";

export const postgresAuth = McpAppAuth.SecretText({
	displayName: "PostgreSQL Database URI",
	description:
		"Enter your PostgreSQL database connection string (e.g., postgresql://username:password@host:port/database). Ensure the user has appropriate read/write permissions based on your needs.",
	required: true,
	validate: async ({ auth }) => {
		const isValid = validateConnectionString(auth);
		if (!isValid) {
			return {
				valid: false,
				error:
					"Invalid PostgreSQL connection string format. Please ensure it starts with 'postgresql://' or 'postgres://'.",
			};
		}

		// validate connection - test if the connection string works
		try {
			const client = new PostgreSQLClient(auth);
			const result = await client.testConnection();
			if (!result) {
				return {
					valid: false,
					error:
						"Failed to connect to the PostgreSQL database. Please check your connection string and database status.",
				};
			}
		} catch (error) {
			return {
				valid: false,
				error: `Connection error: ${error instanceof Error ? error.message : String(error)}. Please check your connection string and database status.`,
			};
		}

		return { valid: true };
	},
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
