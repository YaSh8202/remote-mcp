import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { env } from "@/env";

export const Route = createFileRoute("/.well-known/mcp.json")({
	server: {
		handlers: {
			GET: async () => {
				const endpoint = env.SERVER_URL;
				return json(
					{
						version: "1.0",
						servers: [
							{
								id: "remote-mcp",
								name: "Remote MCP",
								endpoint: endpoint,
								capabilities: ["resourced", "tools"],
								authType: "oauth2",
							},
						],
					},
					{ status: 200 },
				);
			},
		},
	},
});
