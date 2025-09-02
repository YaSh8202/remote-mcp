import { mcpApps } from "@/app/mcp/apps";
import { db } from "@/db";
import { AppConnectionType } from "@/db/schema";
import { appConnectionService } from "@/services/app-connection-service";
import { userSettingsService } from "@/services/user-settings-service";
import type { AppConnection, ConnectionValue } from "@/types/app-connection";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { toFetchResponse, toReqRes } from "fetch-to-node";

class McpNotFoundError extends Error {
	constructor(message = "MCP server not found") {
		super(message);
		this.name = "McpNotFoundError";
	}
}

const getConnectionValue = (connection: AppConnection): ConnectionValue => {
	switch (connection.value.type) {
		case AppConnectionType.SECRET_TEXT:
			return connection.value.secret_text;

		default:
			return connection.value;
	}
};

const buildMcpServer = async (token: string): Promise<McpServer> => {
	const server = new McpServer({
		name: "remote-mcp-server",
		version: "1.0.0",
	});

	const mcpServer = await db.query.mcpServer.findFirst({
		where: (mcpServer, { eq }) => eq(mcpServer.token, token),
		with: {
			apps: true,
		},
	});

	if (!mcpServer) {
		throw new McpNotFoundError("MCP server not found.");
	}

	const userSettings = await userSettingsService.getOrCreateUserSettings(
		mcpServer.ownerId,
	);

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

		const authValue = connection ? getConnectionValue(connection) : undefined;

		const mcpApp = mcpApps.find((a) => a.name === app.appName);
		if (!mcpApp) {
			console.warn(`MCP app ${app.appName} not found.`);
			continue;
		}

		// Register tools with logging context
		await mcpApp.registerTools(server, authValue, app.tools, {
			enabled: userSettings.enableLogging ?? true,
			serverId: mcpServer.id,
			appId: app.id,
			appName: app.appName,
			ownerId: mcpServer.ownerId,
			maxRetries: userSettings.autoRetry ? 1 : 0, // Use 1 for auto-retry, 0 for no retries
		});
	}

	return server;
};

export const ServerRoute = createServerFileRoute("/api/mcp/$id").methods({
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

	POST: async ({ request, params }) => {
		const body = await request.json();
		const { req, res } = toReqRes(request);
		const mcpTokenId = params.id;

		if (!mcpTokenId) {
			return json(
				{
					jsonrpc: "2.0",
					error: {
						code: -32602,
						message: "Invalid parameters - missing id.",
					},
					id: null,
				},
				{ status: 400 },
			);
		}

		try {
			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: undefined,
			});

			const server = await buildMcpServer(mcpTokenId);

			res.on("close", async () => {
				await transport.close();
				await server.close();
			});

			// Connect to the MCP server
			await server.connect(transport);

			// Handle the request
			await transport.handleRequest(req, res, body);

			return toFetchResponse(res);
		} catch (error) {
			console.error("Error handling MCP request:", error);

			// Handle MCP not found error specifically
			if (error instanceof McpNotFoundError) {
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
