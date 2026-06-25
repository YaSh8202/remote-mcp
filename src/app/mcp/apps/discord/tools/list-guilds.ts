import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { discordAuth } from "../common";
import { createDiscordClient, formatDiscordError } from "../discord-client";

export const listGuildsTool = createParameterizedTool({
	name: "list_guilds",
	auth: discordAuth,
	description:
		"List all Discord servers (guilds) that the authenticated user has access to.",
	paramsSchema: {},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);
			const guilds = await client.getUserGuilds();

			const formattedGuilds = guilds.map((guild) => ({
				id: guild.id,
				name: guild.name,
				icon: guild.icon,
				owner: guild.owner,
				permissions: guild.permissions,
				features: guild.features,
			}));

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							guilds: formattedGuilds,
							count: formattedGuilds.length,
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error listing Discord guilds:", error);
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
