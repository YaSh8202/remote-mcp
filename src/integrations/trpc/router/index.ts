import { createTRPCRouter } from "../init";
import { appConnectionRouter } from "./app-connection";
import { mcpAppRouter } from "./mcp-app";
import { mcpRunRouter } from "./mcp-run";
import { mcpServerRouter } from "./mcp-server";

export const trpcRouter = createTRPCRouter({
	mcpServer: mcpServerRouter,
	mcpApp: mcpAppRouter,
	appConnection: appConnectionRouter,
	mcpRun: mcpRunRouter,
});
export type TRPCRouter = typeof trpcRouter;
