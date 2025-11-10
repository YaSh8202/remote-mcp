import { mcpApps } from "@/app/mcp/apps";
import { db } from "@/db";
import { AppConnectionType } from "@/db/schema";
import { env } from "@/env";
import { oauthServer } from "@/lib/oauth2";
import { appConnectionService } from "@/services/app-connection-service";
import { userSettingsService } from "@/services/user-settings-service";
import type { AppConnection, ConnectionValue } from "@/types/app-connection";
import {
	OAuthError,
	Request as OAuthRequest,
	Response as OAuthResponse,
	UnauthorizedRequestError,
} from "@node-oauth/oauth2-server";
import { McpServer } from "@socotra/modelcontextprotocol-sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@socotra/modelcontextprotocol-sdk/server/streamableHttp.js";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { toFetchResponse, toReqRes } from "fetch-to-node";

type McpServerWithApps = Awaited<
	ReturnType<typeof db.query.mcpServer.findFirst>
> & {
	apps?: Array<{
		id: string;
		appName: string;
		connectionId: string | null;
		tools: string[];
	}>;
};

interface ISession {
	userId: string;
	sessionType: string;
	scope: string[];
	expiresAt?: Date;
	user: unknown;
}

// Cache for OAuth 2.1 tokens
const sessionCache = new Map<string, ISession>();

class McpNotFoundError extends Error {
	constructor(message = "MCP server not found") {
		super(message);
		this.name = "McpNotFoundError";
	}
}

class McpAuthenticationError extends Error {
	constructor(message = "Authentication failed") {
		super(message);
		this.name = "McpAuthenticationError";
	}
}

// Validate OAuth token and return session information
const validateOAuthToken = async (request: Request): Promise<ISession> => {
	const apiKey = request.headers.get("X-API-Key");
	if (apiKey && apiKey === env.MCP_SERVER_API_KEY) {
		return {
			userId: request.headers.get("X-User-Id") || "unknown",
			sessionType: "apiKey",
			scope: ["read", "write"],
			user: {
				id: request.headers.get("X-User-Id") || "unknown",
				name: request.headers.get("X-User-Name") || "API User",
			},
		};
	}
	// Simple API key authentication

	const authHeader = request.headers.get?.("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new UnauthorizedRequestError(
			"Missing or invalid Authorization header",
		);
	}

	const token = authHeader.substring(7);

	// Check cache first
	const cachedSession = sessionCache.get(token);
	if (cachedSession?.expiresAt && new Date() < cachedSession.expiresAt) {
		return cachedSession;
	}

	// Use OAuth server to authenticate the token
	const url = new URL(request.url);
	const oauthRequest = new OAuthRequest({
		headers: Object.fromEntries(request.headers),
		method: request.method,
		query: Object.fromEntries(url.searchParams),
	});

	// Create a placeholder response
	const headers = new Headers();
	const oauthResponse = new OAuthResponse({
		headers: (name: string, value: string) => {
			headers.set(name, value);
		},
	});

	// This will throw OAuthError if authentication fails
	const oauthAccessToken = await oauthServer.authenticate(
		oauthRequest,
		oauthResponse,
	);

	const session: ISession = {
		userId: oauthAccessToken.user.id,
		sessionType: "oauth",
		scope: oauthAccessToken.scope || [],
		expiresAt: oauthAccessToken.accessTokenExpiresAt,
		user: oauthAccessToken.user,
	};

	// Cache the session
	sessionCache.set(token, session);

	return session;
};

const getConnectionValue = (connection: AppConnection): ConnectionValue => {
	switch (connection.value.type) {
		case AppConnectionType.SECRET_TEXT:
			return connection.value.secret_text;

		default:
			return connection.value;
	}
};

const buildMcpServer = async (
	token: string,
	userSession: ISession,
): Promise<McpServer> => {
	const server = new McpServer({
		name: "remote-mcp-server",
		version: "1.0.0",
	});

	// OAuth2 authentication - find MCP servers owned by the authenticated user
	// Check if user has read scope
	if (!userSession.scope.includes("read")) {
		throw new McpAuthenticationError(
			"Access token does not have required 'read' scope",
		);
	}

	const mcpServer = (await db.query.mcpServer.findFirst({
		where: (mcpServer, { eq, and }) =>
			and(
				eq(mcpServer.token, token),
				eq(mcpServer.ownerId, userSession.userId),
			),
		with: {
			apps: true,
		},
	})) as McpServerWithApps;

	if (!mcpServer) {
		throw new McpNotFoundError("MCP server not found.");
	}

	const userSettings = await userSettingsService.getOrCreateUserSettings(
		mcpServer.ownerId,
	);

	const apps = mcpServer.apps || [];

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

		// Register tools with logging context and scope-based filtering
		await mcpApp.registerTools(server, authValue, app.tools, {
			enabled: userSettings.enableLogging ?? true,
			serverId: mcpServer.id,
			appId: app.id,
			appName: app.appName,
			ownerId: mcpServer.ownerId,
			maxRetries: userSettings.autoRetry ? 1 : 0,
		});
	}

	return server;
};

export const Route = createFileRoute("/api/mcp/$id")({
	server: {
		handlers: {
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

				let userSession: ISession | undefined;

				try {
					// Try OAuth2 authentication - this will throw OAuthError if authentication fails
					userSession = await validateOAuthToken(request);
				} catch (error) {
					// Handle OAuth authentication errors
					if (error instanceof OAuthError) {
						// console.error("OAuth authentication failed:", error);
						return json(
							{
								jsonrpc: "2.0",
								error: {
									code: -32001, // Authentication error code
									message: `Authentication failed: ${error.message}`,
									data: {
										error: error.name,
										error_description: error.message,
									},
								},
								id: null,
							},
							{ status: error.code },
						);
					}

					throw error;
				}

				if (!userSession) {
					return json(
						{
							jsonrpc: "2.0",
							error: {
								code: -32001, // Authentication error code
								message: "Authentication failed: No valid OAuth token provided",
								data: {
									error: "UnauthorizedRequestError",
									error_description: "No valid OAuth token provided",
								},
							},
							id: null,
						},
						{ status: 401 },
					);
				}

				try {
					const transport = new StreamableHTTPServerTransport({
						sessionIdGenerator: undefined,
					});

					const server = await buildMcpServer(mcpTokenId, userSession);

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

					// Handle authentication errors
					if (error instanceof McpAuthenticationError) {
						return json(
							{
								jsonrpc: "2.0",
								error: {
									code: -32001,
									message: error.message,
								},
								id: null,
							},
							{ status: 401 },
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
		},
	},
});
