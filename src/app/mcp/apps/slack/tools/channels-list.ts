import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { slackAuth } from "../common";
import { createSlackClient, formatSlackError } from "../slack-client";
// import type { Channel } from "@slack/web-api/";

export const channelsListTool = createParameterizedTool({
	name: "channels_list",
	auth: slackAuth,
	description: "Get list of channels",
	paramsSchema: {
		channel_types: z
			.string()
			.describe(
				"Comma-separated channel types. Allowed values: 'mpim', 'im', 'public_channel', 'private_channel'. Example: 'public_channel,private_channel,im'",
			),
		sort: z
			.string()
			.optional()
			.describe(
				"Type of sorting. Allowed values: 'popularity' - sort by number of members/participants in each channel.",
			),
		limit: z
			.number()
			.default(100)
			.describe(
				"The maximum number of items to return. Must be an integer between 1 and 1000 (maximum 999).",
			),
		cursor: z
			.string()
			.optional()
			.describe(
				"Cursor for pagination. Use the value of the last row and column in the response as next_cursor field returned from the previous request.",
			),
	},
	callback: async (params, extra) => {
		try {
			const client = createSlackClient(extra);
			const channelTypes = params.channel_types.split(",");

			type Channel = NonNullable<
				Awaited<ReturnType<typeof client.conversations.list>>["channels"]
			>[number];
			let channels: Channel[] = [];
			let nextCursor = "";

			// Handle public and private channels
			if (
				channelTypes.includes("public_channel") ||
				channelTypes.includes("private_channel")
			) {
				const excludeArchived = true;
				const types = [];

				if (channelTypes.includes("public_channel")) {
					types.push("public_channel");
				}

				if (channelTypes.includes("private_channel")) {
					types.push("private_channel");
				}

				const result = await client.conversations.list({
					exclude_archived: excludeArchived,
					limit: params.limit,
					types: types.join(","),
					cursor: params.cursor,
				});

				channels = [...channels, ...(result.channels || [])];
				nextCursor = result.response_metadata?.next_cursor || "";
			}

			// Handle DMs (IMs)
			if (channelTypes.includes("im")) {
				const result = await client.conversations.list({
					types: "im",
					limit: params.limit,
					cursor: params.cursor,
				});

				channels = [...channels, ...(result.channels || [])];
				if (!nextCursor && result.response_metadata?.next_cursor) {
					nextCursor = result.response_metadata.next_cursor;
				}
			}

			// Handle Group DMs (MPIMs)
			if (channelTypes.includes("mpim")) {
				const result = await client.conversations.list({
					types: "mpim",
					limit: params.limit,
					cursor: params.cursor,
				});

				channels = [...channels, ...(result.channels || [])];
				if (!nextCursor && result.response_metadata?.next_cursor) {
					nextCursor = result.response_metadata.next_cursor;
				}
			}

			// Sort channels if needed
			if (params.sort === "popularity") {
				channels.sort((a, b) => {
					const aNum = a.num_members || 0;
					const bNum = b.num_members || 0;
					return bNum - aNum;
				});
			}

			// Limit the result
			if (channels.length > params.limit) {
				channels = channels.slice(0, params.limit);
			}

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({ channels, next_cursor: nextCursor }),
					},
				],
			};
		} catch (error) {
			console.error("Error fetching channels:", error);
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
