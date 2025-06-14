import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

import { randomUUID } from "node:crypto";
import { githubMcpApp } from "@/app/mcp/apps/github";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { getEvent } from "vinxi/http";
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

type VinxiRequest = ReturnType<typeof getEvent>["node"]["req"];
type VinxiResponse = ReturnType<typeof getEvent>["node"]["res"];

const handleSessionRequest = async (req: VinxiRequest, res: VinxiResponse) => {
	const sessionId = req.headers["mcp-session-id"] as string | undefined;
	if (!sessionId || !transports[sessionId]) {
		res.statusCode = 400;
		res.end("Invalid or missing session ID");
		return;
	}

	const transport = transports[sessionId];
	await transport.handleRequest(req, res);
};

export const APIRoute = createAPIFileRoute("/api/mcp/$id")({
	// @ts-expect-error
	GET: async ({ request, params }) => {
		const req = getEvent().node.req;
		const res = getEvent().node.res;

		handleSessionRequest(req, res);
	},
	// @ts-expect-error
	DELETE: async ({ request }) => {
		const req = getEvent().node.req;
		const res = getEvent().node.res;

		handleSessionRequest(req, res);
	},

	// @ts-expect-error
	POST: async ({ request, params }) => {
		// const sessionId = req.headers['mcp-session-id'] as string | undefined;
		const sessionId = request.headers.get("mcp-session-id") || undefined;
		let transport: StreamableHTTPServerTransport;
		const body = await request.json();
		if (sessionId && transports[sessionId]) {
			// Reuse existing transport
			transport = transports[sessionId];
		} else if (!sessionId && isInitializeRequest(body)) {
			// New initialization request
			transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
				onsessioninitialized: (sessionId) => {
					// Store the transport by session ID
					transports[sessionId] = transport;
				},
			});

			// Clean up transport when closed
			transport.onclose = () => {
				if (transport.sessionId) {
					delete transports[transport.sessionId];
				}
			};
			const server = new McpServer({
				name: "mcp-one-server",
				version: "1.0.0",
			});

			for (const tool of githubMcpApp.tools) {
				if (tool.paramsSchema) {
					server.tool(tool.name, tool.paramsSchema, async (args) => {
						return tool.callback(args);
					});
				}
			}

			// Connect to the MCP server
			await server.connect(transport);
		} else {
			return json(
				{
					error: "Bad Request: No valid session ID provided",
					code: -32000,
				},
				{ status: 400 },
			);
		}

		// Handle the request
		await transport.handleRequest(
			getEvent().node.req,
			getEvent().node.res,
			body,
		);
	},
});
