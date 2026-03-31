import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { discordAuth } from "../common";
import {
	createDiscordClient,
	formatDiscordError,
	formatDiscordMessage,
	parseChannelId,
} from "../discord-client";

export const getMessagesTool = createParameterizedTool({
	name: "get_messages",
	auth: discordAuth,
	description:
		"Get messages from a Discord channel. Can retrieve recent messages or messages around a specific message ID.",
	paramsSchema: {
		channel_id: z
			.string()
			.describe(
				"ID of the Discord channel to get messages from. Can include # prefix (e.g., #general) or just the channel ID.",
			),
		limit: z
			.number()
			.min(1)
			.max(100)
			.default(50)
			.describe("Number of messages to retrieve (1-100, default: 50)."),
		before: z
			.string()
			.optional()
			.describe(
				"Get messages before this message ID (for pagination backwards).",
			),
		after: z
			.string()
			.optional()
			.describe(
				"Get messages after this message ID (for pagination forwards).",
			),
		around: z
			.string()
			.optional()
			.describe("Get messages around this message ID (useful for context)."),
	},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);
			const channelId = parseChannelId(params.channel_id);

			const messages = await client.getChannelMessages(channelId, {
				limit: params.limit,
				before: params.before,
				after: params.after,
				around: params.around,
			});

			const formattedMessages = messages.map(formatDiscordMessage);

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							channel_id: channelId,
							messages: formattedMessages,
							count: formattedMessages.length,
							pagination: {
								before: params.before,
								after: params.after,
								around: params.around,
								limit: params.limit,
							},
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error getting Discord messages:", error);
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
