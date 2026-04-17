import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { discordAuth } from "../common";
import { createDiscordClient, formatDiscordError } from "../discord-client";

interface DiscordMessage {
	id: string;
	content: string;
	author: {
		id: string;
		username: string;
		discriminator: string;
		global_name?: string | null;
	};
	timestamp: string;
	edited_timestamp: string | null;
	attachments: Array<{ url: string; filename: string }>;
	embeds: Array<{ title?: string; description?: string }>;
	reactions?: Array<{ count: number; emoji: { name: string } }>;
	thread?: { id: string; name: string };
}

export const getMessagesTool = createParameterizedTool({
	name: "get_messages",
	auth: discordAuth,
	description:
		"Retrieve messages from a Discord channel. Returns messages in reverse chronological order (newest first).",
	paramsSchema: {
		channel_id: z
			.string()
			.describe("The ID of the Discord channel to retrieve messages from."),
		limit: z
			.number()
			.min(1)
			.max(100)
			.default(50)
			.describe(
				"Maximum number of messages to retrieve. Must be between 1 and 100. Default is 50.",
			),
		before: z
			.string()
			.optional()
			.describe(
				"Retrieve messages before this message ID (for pagination). Messages are returned in reverse chronological order.",
			),
		after: z
			.string()
			.optional()
			.describe(
				"Retrieve messages after this message ID (for pagination). Messages are returned in chronological order.",
			),
	},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);

			const queryParams = new URLSearchParams({
				limit: String(params.limit),
			});
			if (params.before) queryParams.set("before", params.before);
			if (params.after) queryParams.set("after", params.after);

			const messages = await client.get<DiscordMessage[]>(
				`/channels/${params.channel_id}/messages?${queryParams.toString()}`,
			);

			const formatted = messages.map((msg) => ({
				id: msg.id,
				content: msg.content,
				author: {
					id: msg.author.id,
					username: msg.author.global_name ?? msg.author.username,
					discriminator: msg.author.discriminator,
				},
				timestamp: msg.timestamp,
				edited_timestamp: msg.edited_timestamp,
				has_attachments: msg.attachments.length > 0,
				attachments: msg.attachments.map((a) => ({
					filename: a.filename,
					url: a.url,
				})),
				has_embeds: msg.embeds.length > 0,
				reactions: (msg.reactions ?? []).map((r) => ({
					emoji: r.emoji.name,
					count: r.count,
				})),
				thread: msg.thread
					? { id: msg.thread.id, name: msg.thread.name }
					: null,
			}));

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							messages: formatted,
							count: formatted.length,
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error fetching messages:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: formatDiscordError(error),
					},
				],
				isError: true,
			};
		}
	},
});
