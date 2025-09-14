import { env } from "@/env";
import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/.well-known/mcp.json").methods({
	GET: async () => {
		const endpoint =
			env.SERVER_URL ||
			(process.env.NODE_ENV === "production"
				? "https://remotemcp.tech"
				: "http://localhost:3000");
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
});
