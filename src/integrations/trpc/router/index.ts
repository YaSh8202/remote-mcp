import { createTRPCRouter } from "../init";
import { appConnectionRouter } from "./app-connection";
import { mcpAppRouter } from "./mcp-app";
import { mcpServerRouter } from "./mcp-server";

export const trpcRouter = createTRPCRouter({
	mcpServer: mcpServerRouter,
	mcpApp: mcpAppRouter,
	appConnection: appConnectionRouter,
});
export type TRPCRouter = typeof trpcRouter;
