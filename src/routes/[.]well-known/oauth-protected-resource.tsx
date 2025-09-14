import { env } from "@/env";
import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute(
	"/.well-known/oauth-protected-resource",
).methods({
	GET: async () => {
		const baseUrl =
			env.SERVER_URL ||
			(process.env.NODE_ENV === "production"
				? "https://remotemcp.tech"
				: "http://localhost:3000");

		return json({
			resource_name: "Remote MCP",
			resource_documentation: `${baseUrl}/docs`,
			resource: `${baseUrl}/api/mcp`,
			authorization_servers: [baseUrl],
			bearer_methods_supported: ["header"],
			scopes_supported: ["read", "write"],
			resource_policy_uri: `${baseUrl}/privacy-policy`,
			resource_tos_uri: `${baseUrl}/terms-of-service`,
		});
	},
});
