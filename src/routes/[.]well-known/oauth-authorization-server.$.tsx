import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { env } from "@/env";

export const Route = createFileRoute(
	"/.well-known/oauth-authorization-server/$",
)({
	server: {
		handlers: {
			GET: async () => {
				const issuer = env.SERVER_URL;
				return json(
					{
						issuer: issuer,
						authorization_endpoint: `${issuer}/authorize`,
						token_endpoint: `${issuer}/api/oauth/token`,
						registration_endpoint: `${issuer}/api/oauth/register`,
						token_endpoint_auth_methods_supported: ["client_secret_post"],
						scopes_supported: ["read", "write"],
						response_types_supported: ["code"],
						response_modes_supported: ["query"],
						grant_types_supported: ["authorization_code", "refresh_token"],
						code_challenge_methods_supported: ["S256"],
						op_policy_uri: `${issuer}/privacy-policy`,
						op_tos_uri: `${issuer}/terms-of-service`,
					},
					{ status: 200 },
				);
			},
		},
	},
});
