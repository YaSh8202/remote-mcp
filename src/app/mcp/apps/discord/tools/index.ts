import { getGuildChannelsTool } from "./get-guild-channels";
import { getGuildMembersTool } from "./get-guild-members";
import { getGuildsTool } from "./get-guilds";
import { getMessagesTool } from "./get-messages";
import { sendMessageTool } from "./send-message";

export const discordTools = [
	getGuildsTool,
	getGuildChannelsTool,
	getMessagesTool,
	sendMessageTool,
	getGuildMembersTool,
];
