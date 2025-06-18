import { createTRPCRouter } from "../init";
import { mcpAppRouter } from "./mcp-app";
import { mcpServerRouter } from "./mcp-server";

export const trpcRouter = createTRPCRouter({
	mcpServer: mcpServerRouter,
	mcpApp: mcpAppRouter,
});
export type TRPCRouter = typeof trpcRouter;
