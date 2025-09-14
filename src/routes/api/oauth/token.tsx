import { oauthServer } from "@/lib/oauth2";
import { Request, Response } from "@node-oauth/oauth2-server";
import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/oauth/token").methods({
	POST: async ({ request }) => {
		try {
			const formData = await request.formData();
			const body = Object.fromEntries(formData);

			const url = new URL(request.url);
			const oauthRequest = new Request({
				body,
				headers: Object.fromEntries(request.headers),
				method: request.method,
				query: Object.fromEntries(url.searchParams),
			});

			// Create a placeholder response
			const headers = new Headers();
			const oauthResponse = new Response({
				headers: (name: string, value: string) => {
					headers.set(name, value);
				},
			});

			await oauthServer.token(oauthRequest, oauthResponse, {
				alwaysIssueNewRefreshToken: false,
			});

			// Convert scope array to string for OAuth2 spec compliance
			return json(oauthResponse.body, oauthResponse);
		} catch (error) {
			console.error("OAuth token error:", error);
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
});
