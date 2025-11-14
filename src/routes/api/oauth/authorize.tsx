import {
	Response as NodeOAuthResponse,
	Request,
} from "@node-oauth/oauth2-server";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { oauthClients } from "@/db/schema";
import { auth } from "@/lib/auth";
import { oauthServer } from "@/lib/oauth2";

export const Route = createFileRoute("/api/oauth/authorize")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					// const { req, res } = toReqRes(request);
					const url = new URL(request.url);
					const oauthRequest = new Request({
						headers: Object.fromEntries(request.headers),
						method: request.method,
						query: Object.fromEntries(url.searchParams),
					});

					// Create a placeholder response
					// const headers = new Headers();
					// const oauthResponse = new NodeOAuthResponse(res);

					const headers = new Headers();
					const oauthResponse = new NodeOAuthResponse({
						headers: (name: string, value: string) => {
							headers.set(name, value);
						},
					});

					// The user must be logged in to our service
					// to be able to get an OAuth authorization code
					const session = await auth.api.getSession({
						headers: request.headers,
					});
					if (!session?.user) {
						return json({ error: "Unauthorized" }, { status: 401 });
					}

					const sessionUser = session.user;

					const result = await oauthServer.authorize(
						oauthRequest,
						oauthResponse,
						{
							authenticateHandler: {
								handle: async () => {
									// Validate that the client exists
									const clientId = url.searchParams.get("client_id") || "";
									if (!clientId) throw new Error("Client ID not found");

									const client = await db.query.oauthClients.findFirst({
										where: eq(oauthClients.id, clientId),
									});

									if (!client) throw new Error("Client not found");

									// Return the authenticated user
									return { id: sessionUser.id };
								},
							},
						},
					);

					// return toFetchResponse(oauthResponse);

					// return result;
					return json(result, oauthResponse);
					// return JsonResponse(result, oauthResponse);
				} catch (error) {
					console.error("OAuth authorization error:", error);
					return json(
						{
							error: "invalid_request",
							error_description:
								error instanceof Error ? error.message : "Unknown error",
						},
						{ status: 400 },
					);
				}
			},
		},
	},
});
