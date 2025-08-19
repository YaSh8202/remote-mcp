import { McpAppAuth } from "../../mcp-app/property";

export const firecrawlAuth = McpAppAuth.SecretText({
	displayName: "Firecrawl API Key",
	description:
		"Enter your Firecrawl API key to connect to the Firecrawl API. Get your API key from https://www.firecrawl.dev/app/api-keys",
	required: true,
	validate: async ({ auth }) => {
		if (!auth || auth.trim() === "") {
			return {
				valid: false,
				error: "API key is required.",
			};
		}

		// Simple validation to check if the key is a non-empty string
		if (typeof auth !== "string" || auth.trim().length === 0) {
			return {
				valid: false,
				error: "Invalid API key format. Please provide a valid API key.",
			};
		}

		// Test the API key by making a simple request
		try {
			const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${auth}`,
				},
				body: JSON.stringify({
					url: "https://example.com",
					formats: ["markdown"],
					onlyMainContent: true,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					valid: false,
					error: `Failed to authenticate with Firecrawl API: ${
						errorData.error || response.statusText
					}`,
				};
			}
		} catch (error) {
			return {
				valid: false,
				error: `Failed to authenticate with Firecrawl API: ${
					error instanceof Error ? error.message : String(error)
				}`,
			};
		}

		return { valid: true };
	},
});
