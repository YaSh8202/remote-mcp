import { createTRPCRouter } from "../init";
import { appConnectionRouter } from "./app-connection";
import { chatRouter } from "./chat";
import { mcpAppRouter } from "./mcp-app";
import { mcpRunRouter } from "./mcp-run";
import { mcpServerRouter } from "./mcp-server";
import { userRouter } from "./user";
import { userSettingsRouter } from "./user-settings";

export const trpcRouter = createTRPCRouter({
	mcpServer: mcpServerRouter,
	mcpApp: mcpAppRouter,
	appConnection: appConnectionRouter,
	mcpRun: mcpRunRouter,
	user: userRouter,
	userSettings: userSettingsRouter,
	chat: chatRouter,
});
export type TRPCRouter = typeof trpcRouter;
