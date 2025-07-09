import { mcpApps } from "@/app/mcp/apps";
import { db } from "@/db";
import { appConnectionService } from "@/services/app-connection-service";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getEvent } from "vinxi/http";

export const APIRoute = createAPIFileRoute("/api/mcp/$id")({
	GET: async () => {
		return json(
			{
				jsonrpc: "2.0",
				error: {
					code: -32000,
					message: "Method not allowed.",
				},
				id: null,
			},
			{ status: 405 },
		);
	},
	DELETE: async () => {
		return json(
			{
				jsonrpc: "2.0",
				error: {
					code: -32000,
					message: "Method not allowed.",
				},
				id: null,
			},
			{ status: 405 },
		);
	},

	// @ts-expect-error
	POST: async ({ request, params }) => {
		const body = await request.json();
		const req = getEvent().node.req;
		const res = getEvent().node.res;
		const mcpTokenId = params.id;

		try {
			const server = new McpServer({
				name: "mcp-one-server",
				version: "1.0.0",
			});

			const mcpServer = await db.query.mcpServer.findFirst({
				where: (mcpServer, { eq }) => eq(mcpServer.token, mcpTokenId),
				with: {
					apps: true,
				},
			});

			if (!mcpServer) {
				return json(
					{
						jsonrpc: "2.0",
						error: {
							code: -32601,
							message: "MCP server not found.",
						},
						id: null,
					},
					{ status: 404 },
				);
			}

			const apps = mcpServer?.apps || [];

			for (const app of apps) {
				let connection: Awaited<
					ReturnType<typeof appConnectionService.getOne>
				> | null = null;

				if (app.connectionId) {
					connection = await appConnectionService.getOne({
						id: app.connectionId,
						ownerId: mcpServer.ownerId,
					});
				}

				const authValue = connection?.value;

				const mcpApp = mcpApps.find((a) => a.name === app.appName);
				if (!mcpApp) {
					console.warn(`MCP app ${app.appName} not found.`);
					continue;
				}

				// Register tools with logging context
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				await mcpApp.registerTools(server, authValue as any, {
					serverId: mcpServer.id,
					appId: app.id,
					appName: app.appName,
					ownerId: mcpServer.ownerId,
				});
			}

			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: undefined,
			});

			res.on("close", async () => {
				await transport.close();
				await server.close();
			});

			// Connect to the MCP server
			await server.connect(transport);

			// Handle the request
			await transport.handleRequest(req, res, body);
		} catch (error) {
			console.error("Error handling MCP request:", error);
			if (!res.headersSent) {
				return json(
					{
						jsonrpc: "2.0",
						error: {
							code: -32603,
							message: "Internal server error",
						},
						id: null,
					},
					{
						status: 500,
					},
				);
			}
		}
	},
});
