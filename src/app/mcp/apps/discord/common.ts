import { McpAppAuth } from "../../mcp-app/property";

export const discordAuth = McpAppAuth.SecretText({
	displayName: "Discord Bot Token",
	description:
		"Enter your Discord bot token to connect to the Discord API. Create a bot at https://discord.com/developers/applications and copy the token from the Bot section.",
	required: true,
	validate: async ({ auth }) => {
		if (!auth || auth.trim() === "") {
			return {
				valid: false,
				error: "Bot token is required.",
			};
		}

		// Validate by calling the Discord API
		try {
			const response = await fetch("https://discord.com/api/v10/users/@me", {
				headers: {
					Authorization: `Bot ${auth.trim()}`,
				},
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				return {
					valid: false,
					error: `Invalid bot token: ${(error as { message?: string }).message ?? response.statusText}`,
				};
			}

			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				error: `Failed to authenticate with Discord API: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	},
});
