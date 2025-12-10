import type { OAuth2Props } from "@/app/mcp/mcp-app/property";
import type { OAuth2Property } from "@/app/mcp/mcp-app/property/authentication/oauth2-prop";
import type { McpRequestHandlerExtra } from "../../mcp-app/tools";
import type {
	DiscordChannel,
	DiscordEmbed,
	DiscordGuild,
	DiscordMessage,
	DiscordMessagePayload,
	DiscordUser,
} from "./types";

const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Discord API client using OAuth2 access token
 */
export class DiscordClient {
	private accessToken: string;

	constructor(accessToken: string) {
		this.accessToken = accessToken;
	}

	private async makeRequest<T = unknown>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		const url = `${DISCORD_API_BASE}${endpoint}`;
		const headers = {
			Authorization: `Bearer ${this.accessToken}`,
			"Content-Type": "application/json",
			...options.headers,
		};

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Discord API Error (${response.status}): ${errorText}`);
		}

		return response.json();
	}

	/**
	 * Get current user information
	 */
	async getCurrentUser(): Promise<DiscordUser> {
		return this.makeRequest<DiscordUser>("/users/@me");
	}

	/**
	 * Get user's guilds (servers)
	 */
	async getUserGuilds(): Promise<DiscordGuild[]> {
		return this.makeRequest<DiscordGuild[]>("/users/@me/guilds");
	}

	/**
	 * Get guild channels
	 */
	async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
		return this.makeRequest<DiscordChannel[]>(`/guilds/${guildId}/channels`);
	}

	/**
	 * Get channel information
	 */
	async getChannel(channelId: string): Promise<DiscordChannel> {
		return this.makeRequest<DiscordChannel>(`/channels/${channelId}`);
	}

	/**
	 * Send a message to a channel
	 */
	async sendMessage(
		channelId: string,
		content: string,
		embeds?: DiscordEmbed[],
	): Promise<DiscordMessage> {
		const payload: DiscordMessagePayload = { content };
		if (embeds && embeds.length > 0) {
			payload.embeds = embeds;
		}

		return this.makeRequest<DiscordMessage>(`/channels/${channelId}/messages`, {
			method: "POST",
			body: JSON.stringify(payload),
		});
	}

	/**
	 * Get messages from a channel
	 */
	async getChannelMessages(
		channelId: string,
		options: {
			limit?: number;
			before?: string;
			after?: string;
			around?: string;
		} = {},
	): Promise<DiscordMessage[]> {
		const params = new URLSearchParams();
		if (options.limit) params.append("limit", options.limit.toString());
		if (options.before) params.append("before", options.before);
		if (options.after) params.append("after", options.after);
		if (options.around) params.append("around", options.around);

		const query = params.toString();
		const endpoint = `/channels/${channelId}/messages${query ? `?${query}` : ""}`;

		return this.makeRequest<DiscordMessage[]>(endpoint);
	}

	/**
	 * Add reaction to a message
	 */
	async addReaction(
		channelId: string,
		messageId: string,
		emoji: string,
	): Promise<void> {
		return this.makeRequest<void>(
			`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
			{ method: "PUT" },
		);
	}

	/**
	 * Remove reaction from a message
	 */
	async removeReaction(
		channelId: string,
		messageId: string,
		emoji: string,
	): Promise<void> {
		return this.makeRequest<void>(
			`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
			{ method: "DELETE" },
		);
	}

	/**
	 * Get guild members
	 */
	async getGuildMembers(guildId: string, limit = 100): Promise<DiscordUser[]> {
		return this.makeRequest<DiscordUser[]>(
			`/guilds/${guildId}/members?limit=${limit}`,
		);
	}
}

/**
 * Creates a Discord client using the OAuth2 access token
 */
export function createDiscordClient(
	extra: McpRequestHandlerExtra<OAuth2Property<OAuth2Props>>,
): DiscordClient {
	if (!extra.auth?.access_token) {
		throw new Error("No access token available for Discord API");
	}

	return new DiscordClient(extra.auth.access_token);
}

/**
 * Format error messages from Discord API responses
 */
export function formatDiscordError(error: unknown): string {
	if (error instanceof Error) {
		return `Discord API Error: ${error.message}`;
	}

	return `Discord API Error: ${String(error)}`;
}

/**
 * Parse channel ID to handle different formats
 */
export function parseChannelId(channelId: string): string {
	// Remove # prefix if present
	if (channelId.startsWith("#")) {
		return channelId.slice(1);
	}
	return channelId;
}

/**
 * Format a Discord message for display
 */
export function formatDiscordMessage(message: DiscordMessage) {
	return {
		id: message.id,
		content: message.content,
		author: {
			id: message.author.id,
			username: message.author.username,
			discriminator: message.author.discriminator,
		},
		timestamp: message.timestamp,
		channel_id: message.channel_id,
		guild_id: message.guild_id,
		embeds: message.embeds,
		attachments: message.attachments,
	};
}
