import { db } from "@/db";
import { oauthClients } from "@/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/oauth/client")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const clientId = url.searchParams.get("id");

				if (!clientId) {
					return json(
						{
							error: "invalid_request",
							error_description: "Missing client_id parameter",
						},
						{ status: 400 },
					);
				}

				try {
					const client = await db.query.oauthClients.findFirst({
						where: eq(oauthClients.id, clientId),
					});

					if (!client) {
						return json(
							{
								error: "invalid_client",
								error_description: "Client not found",
							},
							{ status: 404 },
						);
					}

					// Return public client information
					return json({
						data: {
							id: client.id,
							name: client.name,
							uri: client.uri,
							redirectUris: client.redirectUris,
							scope: client.scope,
						},
					});
				} catch (error) {
					console.error("Error fetching OAuth client:", error);
					return json(
						{
							error: "server_error",
							error_description: "Internal server error",
						},
						{ status: 500 },
					);
				}
			},
		},
	},
});
