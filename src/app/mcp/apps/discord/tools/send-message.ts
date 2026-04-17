import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { discordAuth } from "../common";
import { createDiscordClient, formatDiscordError } from "../discord-client";

interface DiscordMessage {
	id: string;
	channel_id: string;
	content: string;
	timestamp: string;
	author: {
		id: string;
		username: string;
	};
}

export const sendMessageTool = createParameterizedTool({
	name: "send_message",
	auth: discordAuth,
	description:
		"Send a message to a Discord channel. The bot must have permission to send messages in the target channel.",
	paramsSchema: {
		channel_id: z
			.string()
			.describe("The ID of the Discord channel to send the message to."),
		content: z
			.string()
			.max(2000)
			.describe(
				"The message content to send. Supports Discord markdown formatting. Maximum 2000 characters.",
			),
		reply_to_message_id: z
			.string()
			.optional()
			.describe(
				"The ID of a message to reply to. If provided, the sent message will be a reply to that message.",
			),
	},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);

			const body: {
				content: string;
				message_reference?: { message_id: string };
			} = {
				content: params.content,
			};

			if (params.reply_to_message_id) {
				body.message_reference = {
					message_id: params.reply_to_message_id,
				};
			}

			const message = await client.post<DiscordMessage>(
				`/channels/${params.channel_id}/messages`,
				body,
			);

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							success: true,
							message: {
								id: message.id,
								channel_id: message.channel_id,
								content: message.content,
								timestamp: message.timestamp,
								author: {
									id: message.author.id,
									username: message.author.username,
								},
							},
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error sending message:", error);
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
