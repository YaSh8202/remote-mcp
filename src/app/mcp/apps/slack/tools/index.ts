import { channelsListTool } from "./channels-list";
import { conversationsAddMessageTool } from "./conversations-add-message";
import { conversationsHistoryTool } from "./conversations-history";
import { conversationsRepliesTools } from "./conversations-replies";
import { conversationsSearchMessagesTool } from "./conversations-search-messages";

export const slackTools = [
	conversationsHistoryTool,
	conversationsRepliesTools,
	conversationsAddMessageTool,
	conversationsSearchMessagesTool,
	channelsListTool,
];
