import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { discordAuth } from "../common";
import { createDiscordClient, formatDiscordError } from "../discord-client";

export const listChannelsTool = createParameterizedTool({
	name: "list_channels",
	auth: discordAuth,
	description:
		"List all channels in a Discord server (guild). Shows text channels, voice channels, and categories.",
	paramsSchema: {
		guild_id: z
			.string()
			.describe("ID of the Discord server (guild) to list channels from."),
	},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);
			const channels = await client.getGuildChannels(params.guild_id);

			const formattedChannels = channels.map((channel) => ({
				id: channel.id,
				name: channel.name,
				type: channel.type,
				position: channel.position,
				parent_id: channel.parent_id,
				topic: channel.topic,
				nsfw: channel.nsfw,
				permission_overwrites: channel.permission_overwrites,
			}));

			// Group channels by type for better organization
			const channelsByType = {
				text: formattedChannels.filter((c) => c.type === 0),
				voice: formattedChannels.filter((c) => c.type === 2),
				category: formattedChannels.filter((c) => c.type === 4),
				announcement: formattedChannels.filter((c) => c.type === 5),
				thread: formattedChannels.filter((c) => [10, 11, 12].includes(c.type)),
				forum: formattedChannels.filter((c) => c.type === 15),
				other: formattedChannels.filter(
					(c) => ![0, 2, 4, 5, 10, 11, 12, 15].includes(c.type),
				),
			};

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							guild_id: params.guild_id,
							channels: formattedChannels,
							channels_by_type: channelsByType,
							total_count: formattedChannels.length,
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error listing Discord channels:", error);
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
