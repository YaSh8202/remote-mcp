import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { OAuthClientGrant, OAuthClientScope, oauthClients } from "@/db/schema";
import { generateId } from "@/lib/id";
import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { z } from "zod";

const registrationSchema = z.object({
	redirect_uris: z.array(z.string().url()).min(1),
	token_endpoint_auth_method: z.enum([
		"none",
		"client_secret_basic",
		"client_secret_post",
	]),
	grant_types: z.array(z.string()).min(1),
	response_types: z.array(z.enum(["code", "token"])).min(1),
	client_name: z.string().min(1),
	client_uri: z.string().url().optional(),
	scope: z.string().default("read").optional(),
});

export const ServerRoute = createServerFileRoute("/api/oauth/register").methods(
	{
		POST: async ({ request }) => {
			try {
				const body = await request.json();
				const result = registrationSchema.safeParse(body);

				if (!result.success) {
					return json(
						{
							error: "invalid_client_metadata",
							error_description: result.error.issues
								.map((issue) => issue.message)
								.join(", "),
						},
						{ status: 400 },
					);
				}

				// Parse scopes - handle both space-separated and array formats
				const scopeParam = result.data.scope || "read";
				const scopes = scopeParam
					.split(" ")
					.filter(Boolean)
					.flatMap((s) => s.split("+"))
					.filter((scope) =>
						Object.values(OAuthClientScope).includes(scope as OAuthClientScope),
					) as OAuthClientScope[];

				// Ensure we have at least read scope
				if (scopes.length === 0) {
					scopes.push(OAuthClientScope.READ);
				}

				// Validate grant types
				const grants = result.data.grant_types.filter((grant) =>
					Object.values(OAuthClientGrant).includes(grant as OAuthClientGrant),
				) as OAuthClientGrant[];

				if (grants.length === 0) {
					return json(
						{
							error: "invalid_client_metadata",
							error_description: "No valid grant types provided",
						},
						{ status: 400 },
					);
				}

				const clientId = generateId();
				const clientSecret = randomBytes(32).toString("hex");

				const [oauthClient] = await db
					.insert(oauthClients)
					.values({
						id: clientId,
						name: result.data.client_name,
						uri: result.data.client_uri || "",
						secret: clientSecret,
						redirectUris: result.data.redirect_uris,
						grants,
						scope: scopes,
						accessTokenLifetime: (7 * 24 * 60 * 60).toString(), // 7 days
						refreshTokenLifetime: (30 * 24 * 60 * 60).toString(), // 30 days
					})
					.returning();

				return json(
					{
						client_id: oauthClient.id,
						client_secret: oauthClient.secret,
						client_id_issued_at: Math.floor(
							oauthClient.createdAt.getTime() / 1000,
						),
						client_secret_expires_at: 0, // Never expires
						redirect_uris: oauthClient.redirectUris,
						scope: oauthClient.scope.join(" "),
					},
					{ status: 201 },
				);
			} catch (error) {
				console.error("OAuth registration error:", error);
				return json(
					{
						error: "server_error",
						error_description: "Internal server error",
					},
					{ status: 500 },
				);
			}
		},
		GET: async () => {
			return json(
				{
					error: "invalid_request",
					error_description: "GET method not supported on this endpoint",
				},
				{ status: 405 },
			);
		},
	},
);
