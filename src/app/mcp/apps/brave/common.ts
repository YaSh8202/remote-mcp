import { BraveSearch } from "brave-search";
import { McpAppAuth } from "../../mcp-app/property";

export const braveAuth = McpAppAuth.SecretText({
	displayName: "Brave Search API Key",
	description:
		"Enter your Brave Search API key to connect to the Brave Search API. Get your API key from https://brave.com/search/api/",
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

		// test the API key by making a simple request
		try {
			const braveSearch = new BraveSearch(auth);
			await braveSearch.webSearch("test", { count: 1 });
		} catch (error) {
			return {
				valid: false,
				error: `Failed to authenticate with Brave Search API: ${error instanceof Error ? error.message : String(error)}`,
			};
		}

		return { valid: true };
	},
});
