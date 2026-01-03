import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { slackAuth } from "../common";
import { createSlackClient, formatSlackError } from "../slack-client";

export const conversationsSearchMessagesTool = createParameterizedTool({
	name: "conversations_search_messages",
	auth: slackAuth,
	description:
		"Search messages in a public channel, private channel, or direct message (DM, or IM) conversation using filters. All filters are optional, if not provided then search_query is required.",
	paramsSchema: {
		search_query: z
			.string()
			.optional()
			.describe(
				"Search query to filter messages. Example: 'marketing report'.",
			),
		filter_in_channel: z
			.string()
			.optional()
			.describe(
				"Filter messages in a specific channel by its ID or name. Example: 'C1234567890' or '#general'. If not provided, all channels will be searched.",
			),
		filter_in_im_or_mpim: z
			.string()
			.optional()
			.describe(
				"Filter messages in a direct message (DM) or multi-person direct message (MPIM) conversation by its ID or name. Example: 'D1234567890' or '@username_dm'. If not provided, all DMs and MPIMs will be searched.",
			),
		filter_users_with: z
			.string()
			.optional()
			.describe(
				"Filter messages with a specific user by their ID or display name in threads and DMs. Example: 'U1234567890' or '@username'. If not provided, all threads and DMs will be searched.",
			),
		filter_users_from: z
			.string()
			.optional()
			.describe(
				"Filter messages from a specific user by their ID or display name. Example: 'U1234567890' or '@username'. If not provided, all users will be searched.",
			),
		filter_date_before: z
			.string()
			.optional()
			.describe(
				"Filter messages sent before a specific date in format 'YYYY-MM-DD'. Example: '2023-10-01', 'July', 'Yesterday' or 'Today'. If not provided, all dates will be searched.",
			),
		filter_date_after: z
			.string()
			.optional()
			.describe(
				"Filter messages sent after a specific date in format 'YYYY-MM-DD'. Example: '2023-10-01', 'July', 'Yesterday' or 'Today'. If not provided, all dates will be searched.",
			),
		filter_date_on: z
			.string()
			.optional()
			.describe(
				"Filter messages sent on a specific date in format 'YYYY-MM-DD'. Example: '2023-10-01', 'July', 'Yesterday' or 'Today'. If not provided, all dates will be searched.",
			),
		filter_date_during: z
			.string()
			.optional()
			.describe(
				"Filter messages sent during a specific period in format 'YYYY-MM-DD'. Example: 'July', 'Yesterday' or 'Today'. If not provided, all dates will be searched.",
			),
		filter_threads_only: z
			.boolean()
			.default(false)
			.describe(
				"If true, the response will include only messages from threads. Default is boolean false.",
			),
		cursor: z
			.string()
			.default("")
			.describe(
				"Cursor for pagination. Use the value of the last row and column in the response as next_cursor field returned from the previous request.",
			),
		limit: z
			.number()
			.default(20)
			.describe(
				"The maximum number of items to return. Must be an integer between 1 and 100.",
			),
	},
	callback: async (params, extra) => {
		try {
			const client = createSlackClient(extra);

			// Slack doesn't have a direct API to search messages with these specific filters
			// In a real implementation, we would need to use the search.messages API and then filter the results

			// For this implementation, we'll use the search.messages API with the query and then apply our own filters
			const query = buildSearchQuery(params);

			const result = await client.search.messages({
				query,
				count: params.limit,
				page: params.cursor ? Number.parseInt(params.cursor, 10) : 1,
			});

			// In a real implementation, we would filter the results based on the parameters

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							messages: result.messages?.matches || [],
							next_cursor:
								result.messages?.pagination?.page_count !== undefined &&
								result.messages.pagination.page_count >
									(params.cursor ? Number.parseInt(params.cursor, 10) : 1)
									? String(
											(params.cursor ? Number.parseInt(params.cursor, 10) : 1) +
												1,
										)
									: "",
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error searching messages:", error);
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

/**
 * Build a search query string from the parameters
 */
function buildSearchQuery(params: {
	search_query?: string;
	filter_in_channel?: string;
	filter_in_im_or_mpim?: string;
	filter_users_with?: string;
	filter_users_from?: string;
	filter_date_before?: string;
	filter_date_after?: string;
	filter_date_on?: string;
	filter_date_during?: string;
	filter_threads_only?: boolean;
}): string {
	const parts: string[] = [];

	// Add the main search query
	if (params.search_query) {
		parts.push(params.search_query);
	}

	// Add channel filter
	if (params.filter_in_channel) {
		parts.push(`in:${params.filter_in_channel}`);
	}

	// Add DM/MPIM filter
	if (params.filter_in_im_or_mpim) {
		parts.push(`in:${params.filter_in_im_or_mpim}`);
	}

	// Add user filters
	if (params.filter_users_with) {
		parts.push(`with:${params.filter_users_with}`);
	}

	if (params.filter_users_from) {
		parts.push(`from:${params.filter_users_from}`);
	}

	// Add date filters
	if (params.filter_date_before) {
		parts.push(`before:${params.filter_date_before}`);
	}

	if (params.filter_date_after) {
		parts.push(`after:${params.filter_date_after}`);
	}

	if (params.filter_date_on) {
		parts.push(`on:${params.filter_date_on}`);
	}

	if (params.filter_date_during) {
		parts.push(`during:${params.filter_date_during}`);
	}

	// Add threads filter
	if (params.filter_threads_only) {
		parts.push("has:thread");
	}

	return parts.join(" ");
}
