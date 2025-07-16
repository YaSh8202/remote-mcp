import { createTRPCRouter } from "../init";
import { appConnectionRouter } from "./app-connection";
import { mcpAppRouter } from "./mcp-app";
import { mcpRunRouter } from "./mcp-run";
import { mcpServerRouter } from "./mcp-server";
import { userRouter } from "./user";

export const trpcRouter = createTRPCRouter({
	mcpServer: mcpServerRouter,
	mcpApp: mcpAppRouter,
	appConnection: appConnectionRouter,
	mcpRun: mcpRunRouter,
	user: userRouter,
});
export type TRPCRouter = typeof trpcRouter;
