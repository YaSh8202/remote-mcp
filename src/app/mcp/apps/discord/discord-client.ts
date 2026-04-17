import type { McpAppAuthProperty } from "../../mcp-app/property/authentication";
import type { McpRequestHandlerExtra } from "../../mcp-app/tools";

const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Extracts the bot token from the extra auth object
 */
function getBotToken(
	extra: McpRequestHandlerExtra<McpAppAuthProperty>,
): string {
	const auth = extra.auth as { auth?: string } | undefined;
	const token = auth?.auth;
	if (!token) {
		throw new Error("No bot token available for Discord API");
	}
	return token;
}

/**
 * Creates a Discord API request client using the bot token from auth
 */
export function createDiscordClient(
	extra: McpRequestHandlerExtra<McpAppAuthProperty>,
) {
	const token = getBotToken(extra);

	const headers: Record<string, string> = {
		Authorization: `Bot ${token}`,
		"Content-Type": "application/json",
	};

	return {
		async get<T = unknown>(path: string): Promise<T> {
			const response = await fetch(`${DISCORD_API_BASE}${path}`, {
				method: "GET",
				headers,
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				throw new DiscordAPIError(
					(error as { message?: string }).message ?? response.statusText,
					response.status,
				);
			}

			return response.json() as Promise<T>;
		},

		async post<T = unknown>(path: string, body: unknown): Promise<T> {
			const response = await fetch(`${DISCORD_API_BASE}${path}`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				throw new DiscordAPIError(
					(error as { message?: string }).message ?? response.statusText,
					response.status,
				);
			}

			return response.json() as Promise<T>;
		},
	};
}

export class DiscordAPIError extends Error {
	constructor(
		message: string,
		public readonly status: number,
	) {
		super(message);
		this.name = "DiscordAPIError";
	}
}

/**
 * Format Discord API error for display
 */
export function formatDiscordError(error: unknown): string {
	if (error instanceof DiscordAPIError) {
		return `Discord API Error (${error.status}): ${error.message}`;
	}
	if (error instanceof Error) {
		return `Discord API Error: ${error.message}`;
	}
	return `Discord API Error: ${String(error)}`;
}
