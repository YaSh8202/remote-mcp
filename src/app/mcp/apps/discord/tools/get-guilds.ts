import { createSimpleTool } from "@/app/mcp/mcp-app/tools";
import { createDiscordClient, formatDiscordError } from "../discord-client";

interface DiscordGuild {
	id: string;
	name: string;
	icon: string | null;
	owner: boolean;
	permissions: string;
	features: string[];
}

export const getGuildsTool = createSimpleTool({
	name: "get_guilds",
	description:
		"Get the list of guilds (servers) that the Discord bot is a member of.",
	callback: async (extra) => {
		try {
			const client = createDiscordClient(extra);
			const guilds = await client.get<DiscordGuild[]>("/users/@me/guilds");

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(
							guilds.map((guild) => ({
								id: guild.id,
								name: guild.name,
								icon: guild.icon
									? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
									: null,
								owner: guild.owner,
								features: guild.features,
							})),
						),
					},
				],
			};
		} catch (error) {
			console.error("Error fetching guilds:", error);
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
