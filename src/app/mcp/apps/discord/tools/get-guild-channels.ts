import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { discordAuth } from "../common";
import { createDiscordClient, formatDiscordError } from "../discord-client";

interface DiscordChannel {
	id: string;
	type: number;
	guild_id?: string;
	name?: string;
	topic?: string | null;
	nsfw?: boolean;
	position?: number;
	parent_id?: string | null;
}

// Discord channel types
const CHANNEL_TYPE_NAMES: Record<number, string> = {
	0: "text",
	1: "dm",
	2: "voice",
	3: "group_dm",
	4: "category",
	5: "announcement",
	10: "announcement_thread",
	11: "public_thread",
	12: "private_thread",
	13: "stage_voice",
	14: "directory",
	15: "forum",
	16: "media",
};

export const getGuildChannelsTool = createParameterizedTool({
	name: "get_guild_channels",
	auth: discordAuth,
	description:
		"Get the list of channels in a Discord guild (server). Returns text, voice, category, and other channel types.",
	paramsSchema: {
		guild_id: z
			.string()
			.describe(
				"The ID of the Discord guild (server) to retrieve channels from.",
			),
		channel_type: z
			.enum(["text", "voice", "category", "all"])
			.default("all")
			.describe(
				"Filter channels by type. 'text' returns only text channels, 'voice' returns voice channels, 'category' returns categories, 'all' returns everything.",
			),
	},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);
			const channels = await client.get<DiscordChannel[]>(
				`/guilds/${params.guild_id}/channels`,
			);

			const channelTypeFilter: Record<string, number[]> = {
				text: [0, 5], // text + announcement
				voice: [2, 13], // voice + stage
				category: [4],
				all: Object.keys(CHANNEL_TYPE_NAMES).map(Number),
			};

			const allowedTypes =
				channelTypeFilter[params.channel_type] ?? channelTypeFilter.all;

			const filtered = channels
				.filter((ch) => allowedTypes.includes(ch.type))
				.map((ch) => ({
					id: ch.id,
					name: ch.name ?? null,
					type: CHANNEL_TYPE_NAMES[ch.type] ?? `unknown(${ch.type})`,
					type_id: ch.type,
					topic: ch.topic ?? null,
					nsfw: ch.nsfw ?? false,
					position: ch.position ?? 0,
					parent_id: ch.parent_id ?? null,
				}))
				.sort((a, b) => a.position - b.position);

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({ channels: filtered }),
					},
				],
			};
		} catch (error) {
			console.error("Error fetching guild channels:", error);
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
