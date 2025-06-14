import { githubMcpApp } from "@/app/mcp/apps/github";
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

		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});

		res.on("close", () => {
			console.log("Request closed");
			transport.close();
			server.close();
		});

		const server = new McpServer({
			name: "mcp-one-server",
			version: "1.0.0",
		});

		for (const tool of githubMcpApp.tools) {
			if (tool.paramsSchema) {
				if (tool.description) {
					server.tool(
						tool.name,
						tool.description,
						tool.paramsSchema,
						async (args) => {
							return tool.callback(args);
						},
					);
				} else {
					server.tool(tool.name, tool.paramsSchema, async (args) => {
						return tool.callback(args);
					});
				}
			}
		}

		// Connect to the MCP server
		await server.connect(transport);

		// Handle the request
		await transport.handleRequest(req, res, body);
	},
});
