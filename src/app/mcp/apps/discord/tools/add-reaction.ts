import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { discordAuth } from "../common";
import {
	createDiscordClient,
	formatDiscordError,
	parseChannelId,
} from "../discord-client";

export const addReactionTool = createParameterizedTool({
	name: "add_reaction",
	auth: discordAuth,
	description:
		"Add a reaction (emoji) to a Discord message. Supports both Unicode emojis and custom server emojis.",
	paramsSchema: {
		channel_id: z
			.string()
			.describe(
				"ID of the Discord channel containing the message. Can include # prefix (e.g., #general) or just the channel ID.",
			),
		message_id: z
			.string()
			.describe("ID of the message to add the reaction to."),
		emoji: z
			.string()
			.describe(
				"Emoji to add as a reaction. Can be Unicode emoji (e.g., '👍', '❤️') or custom emoji name (e.g., 'custom_emoji_name').",
			),
	},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);
			const channelId = parseChannelId(params.channel_id);

			await client.addReaction(channelId, params.message_id, params.emoji);

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							success: true,
							channel_id: channelId,
							message_id: params.message_id,
							emoji: params.emoji,
							action: "added",
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error adding Discord reaction:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: formatDiscordError(error),
					},
				],
			};
		}
	},
});
