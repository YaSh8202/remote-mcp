import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { discordAuth } from "../common";
import { createDiscordClient, formatDiscordError } from "../discord-client";

interface DiscordMember {
	user?: {
		id: string;
		username: string;
		discriminator: string;
		global_name?: string | null;
		avatar?: string | null;
		bot?: boolean;
	};
	nick?: string | null;
	roles: string[];
	joined_at: string;
	premium_since?: string | null;
	pending?: boolean;
}

export const getGuildMembersTool = createParameterizedTool({
	name: "get_guild_members",
	auth: discordAuth,
	description:
		"Get the list of members in a Discord guild (server). Requires the bot to have the GUILD_MEMBERS privileged intent enabled in the Discord Developer Portal.",
	paramsSchema: {
		guild_id: z
			.string()
			.describe(
				"The ID of the Discord guild (server) to retrieve members from.",
			),
		limit: z
			.number()
			.min(1)
			.max(1000)
			.default(100)
			.describe(
				"Maximum number of members to retrieve. Must be between 1 and 1000. Default is 100.",
			),
		after: z
			.string()
			.optional()
			.describe(
				"Retrieve members after this user ID (for pagination, based on user ID).",
			),
	},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);

			const queryParams = new URLSearchParams({
				limit: String(params.limit),
			});
			if (params.after) queryParams.set("after", params.after);

			const members = await client.get<DiscordMember[]>(
				`/guilds/${params.guild_id}/members?${queryParams.toString()}`,
			);

			const formatted = members
				.filter((m) => !m.user?.bot) // Exclude bots by default
				.map((m) => ({
					user_id: m.user?.id ?? null,
					username: m.user?.global_name ?? m.user?.username ?? null,
					discriminator: m.user?.discriminator ?? null,
					nickname: m.nick ?? null,
					role_ids: m.roles,
					joined_at: m.joined_at,
					premium_since: m.premium_since ?? null,
					pending: m.pending ?? false,
				}));

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							members: formatted,
							count: formatted.length,
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error fetching guild members:", error);
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
