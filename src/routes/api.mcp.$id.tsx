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

		try {
			const server = new McpServer({
				name: "mcp-one-server",
				version: "1.0.0",
			});

			// const sampleGithubAuth = {
			// 	access_token: "sample-github-access-token", // Replace with a valid GitHub access token
			// 	data: {},
			// } as unknown as typeof githubMcpApp.auth;

			// Register all tools from the GitHub app with the auth
			githubMcpApp.registerTools(server);

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
