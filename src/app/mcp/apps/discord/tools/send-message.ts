import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { discordAuth } from "../common";
import {
	createDiscordClient,
	formatDiscordError,
	parseChannelId,
} from "../discord-client";

export const sendMessageTool = createParameterizedTool({
	name: "send_message",
	auth: discordAuth,
	description:
		"Send a message to a Discord channel. Supports both text content and embeds.",
	paramsSchema: {
		channel_id: z
			.string()
			.describe(
				"ID of the Discord channel to send the message to. Can include # prefix (e.g., #general) or just the channel ID.",
			),
		content: z
			.string()
			.describe(
				"The message content to send. Supports Discord markdown formatting.",
			),
		embeds: z
			.array(
				z.object({
					title: z.string().optional(),
					description: z.string().optional(),
					color: z.number().optional(),
					url: z.string().optional(),
					timestamp: z.string().optional(),
					footer: z
						.object({
							text: z.string(),
							icon_url: z.string().optional(),
						})
						.optional(),
					image: z
						.object({
							url: z.string(),
						})
						.optional(),
					thumbnail: z
						.object({
							url: z.string(),
						})
						.optional(),
					author: z
						.object({
							name: z.string(),
							url: z.string().optional(),
							icon_url: z.string().optional(),
						})
						.optional(),
					fields: z
						.array(
							z.object({
								name: z.string(),
								value: z.string(),
								inline: z.boolean().optional(),
							}),
						)
						.optional(),
				}),
			)
			.optional()
			.describe("Optional array of embed objects to include with the message."),
	},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);
			const channelId = parseChannelId(params.channel_id);

			const result = await client.sendMessage(
				channelId,
				params.content,
				params.embeds,
			);

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							success: true,
							message: {
								id: result.id,
								channel_id: result.channel_id,
								content: result.content,
								timestamp: result.timestamp,
							},
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error sending Discord message:", error);
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
