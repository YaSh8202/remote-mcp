import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { slackAuth } from "../common";
import {
	createSlackClient,
	formatSlackError,
	parseChannelId,
} from "../slack-client";

export const conversationsHistoryTool = createParameterizedTool({
	name: "conversations_history",
	auth: slackAuth,
	description:
		"Get messages from the channel (or DM) by channel_id, the last row/column in the response is used as 'cursor' parameter for pagination if not empty",
	paramsSchema: {
		channel_id: z
			.string()
			.describe(
				"ID of the channel in format Cxxxxxxxxxx or its name starting with #... or @... aka #general or @username_dm.",
			),
		include_activity_messages: z
			.boolean()
			.default(false)
			.describe(
				"If true, the response will include activity messages such as channel_join or channel_leave. Default is false.",
			),
		cursor: z
			.string()
			.optional()
			.describe(
				"Cursor for pagination. Use the value of the last row and column in the response as next_cursor field returned from the previous request.",
			),
		limit: z
			.string()
			.default("1d")
			.describe(
				"Limit of messages to fetch in format of maximum ranges of time (e.g. 1d - 1 day, 30d - 30 days, 90d - 90 days which is a default limit for free tier history) or number of messages (e.g. 50). Must be empty when 'cursor' is provided.",
			),
	},
	callback: async (params, extra) => {
		try {
			const client = createSlackClient(extra);
			const channelId = parseChannelId(params.channel_id);

			// Construct API parameters
			const apiParams = {
				channel: channelId,
				inclusive: true,
				limit: params.limit.match(/^\d+$/)
					? Number.parseInt(params.limit, 10)
					: 100, // Default to 100 if not a number
				...(params.cursor ? { cursor: params.cursor } : {}),
			};

			const result = await client.conversations.history(apiParams);

			// Filter out activity messages if needed
			let messages = result.messages || [];
			if (!params.include_activity_messages) {
				messages = messages.filter((msg) => {
					// Check if subtype exists and filter out join/leave messages
					const subtype =
						"subtype" in msg ? (msg.subtype as string) : undefined;
					return (
						!subtype ||
						(!subtype.includes("_join") && !subtype.includes("_leave"))
					);
				});
			}

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							messages,
							next_cursor: result.response_metadata?.next_cursor || "",
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error fetching conversation history:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: formatSlackError(error),
					},
				],
			};
		}
	},
});
