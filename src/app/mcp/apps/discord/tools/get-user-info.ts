import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { discordAuth } from "../common";
import { createDiscordClient, formatDiscordError } from "../discord-client";

export const getUserInfoTool = createParameterizedTool({
	name: "get_user_info",
	auth: discordAuth,
	description:
		"Get information about the currently authenticated Discord user.",
	paramsSchema: {},
	callback: async (params, extra) => {
		try {
			const client = createDiscordClient(extra);
			const user = await client.getCurrentUser();

			const userInfo = {
				id: user.id,
				username: user.username,
				discriminator: user.discriminator,
				global_name: user.global_name,
				avatar: user.avatar,
				bot: user.bot,
				system: user.system,
				mfa_enabled: user.mfa_enabled,
				banner: user.banner,
				accent_color: user.accent_color,
				locale: user.locale,
				verified: user.verified,
				email: user.email,
				flags: user.flags,
				premium_type: user.premium_type,
				public_flags: user.public_flags,
			};

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify({
							user: userInfo,
						}),
					},
				],
			};
		} catch (error) {
			console.error("Error getting Discord user info:", error);
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
