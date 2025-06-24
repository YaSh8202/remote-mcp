import { mcpApps } from "@/app/mcp/apps";
import { db } from "@/db";
import { decryptObject } from "@/lib/encryption";
import type { AppConnectionValue } from "@/types/app-connection";
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
					apps: {
						with: {
							connection: true,
						},
					},
				},
			});

			const apps = mcpServer?.apps || [];

			for (const app of apps) {
				const authValue = app.connection?.value;
				const decryptedAuthValue = decryptObject<AppConnectionValue>(authValue);

				const mcpApp = mcpApps.find((a) => a.name === app.appName);
				if (!mcpApp) {
					console.warn(`MCP app ${app.appName} not found.`);
					continue;
				}

				mcpApp.registerTools(server, decryptedAuthValue);
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
