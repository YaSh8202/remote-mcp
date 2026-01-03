import { addReactionTool } from "./add-reaction";
import { getMessagesTool } from "./get-messages";
import { getUserInfoTool } from "./get-user-info";
import { listChannelsTool } from "./list-channels";
import { listGuildsTool } from "./list-guilds";
import { sendMessageTool } from "./send-message";

export const discordTools = [
	getUserInfoTool,
	listGuildsTool,
	listChannelsTool,
	sendMessageTool,
	getMessagesTool,
	addReactionTool,
];
