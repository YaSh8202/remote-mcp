import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { slackAuth } from "../common";
import {
	createSlackClient,
	formatSlackError,
	parseChannelId,
} from "../slack-client";

export const conversationsRepliesTools = createParameterizedTool({
	name: "conversations_replies",
	auth: slackAuth,
	description:
		"Get a thread of messages posted to a conversation by channelID and thread_ts, the last row/column in the response is used as cursor parameter for pagination if not empty.",
	paramsSchema: {
		channel_id: z
			.string()
			.describe(
				"ID of the channel in format Cxxxxxxxxxx or its name starting with #... or @... aka #general or @username_dm.",
			),
		thread_ts: z
			.string()
			.describe(
				"Unique identifier of either a thread's parent message or a message in the thread. ts must be the timestamp in format 1234567890.123456 of an existing message with 0 or more replies.",
			),
		include_activity_messages: z
			.boolean()
			.default(false)
			.describe(
				"If true, the response will include activity messages such as channel_join or channel_leave. Default is boolean false.",
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
				ts: params.thread_ts,
				inclusive: true,
				limit: params.limit.match(/^\d+$/)
					? Number.parseInt(params.limit, 10)
					: 100,
				...(params.cursor ? { cursor: params.cursor } : {}),
			};

			const result = await client.conversations.replies(apiParams);

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
			console.error("Error fetching thread replies:", error);
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
