import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { ExternalLink, Shield } from "lucide-react";
import { z } from "zod/v4";
import { RemoteMcpLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useOAuthClient } from "@/hooks/use-oauth-client";
import { authQueries } from "@/services/queries";

const searchSchema = z.object({
	client_id: z.string().catch(""),
	redirect_uri: z.string().optional(),
	response_type: z.string().optional(),
	scope: z.string().optional(),
	state: z.string().optional(),
	code_challenge: z.string().optional(),
	code_challenge_method: z.string().optional(),
});

export const Route = createFileRoute("/authorize")({
	validateSearch: searchSchema,
	component: AuthorizePage,
});

function AuthorizePage() {
	const search = useSearch({ from: "/authorize" });
	const navigate = useNavigate();

	// Get user session using the same pattern as the project
	const {
		data: userSession,
		isLoading: authLoading,
		error: authError,
	} = useQuery(authQueries.user());
	const user = userSession?.user;

	const { oauthClient, query } = useOAuthClient({ id: search.client_id || "" });

	const authorize = async () => {
		// Build new search params with selected scopes
		const params = new URLSearchParams(window.location.search);
		params.set("scope", ["read", "write"].join(" "));

		// Navigate to the OAuth redirect page which will handle the actual redirect
		navigate({
			to: "/oauth/redirect",
			search: Object.fromEntries(params.entries()),
		});
	};

	// Show loading state
	if (authLoading || query.isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg font-semibold">Loading...</div>
			</div>
		);
	}

	// Redirect to login if not authenticated
	if (authError || !user) {
		// Redirect to login with return URL
		const returnUrl = encodeURIComponent(window.location.href);
		window.location.href = `/login?from=${returnUrl}`;
		return null;
	}

	// Show error if client not found
	if (query.isError || !oauthClient) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-lg">
					<CardHeader>
						<CardTitle className="text-red-600">
							Application Not Found
						</CardTitle>
						<CardDescription>
							The requested application could not be found.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col space-y-5 items-center justify-center p-4">
			<div className="flex items-center space-x-3 mb-4">
				<RemoteMcpLogo className="size-12 fill-white" />
				<h1 className="text-2xl font-bold">Remote MCP</h1>
			</div>
			<Card className="w-full max-w-lg">
				<CardHeader className="text-center">
					<div className="flex items-center justify-center mb-4">
						<Shield className="h-12 w-12 text-blue-600" />
					</div>
					<CardTitle className="text-2xl">
						<a
							href={oauthClient.uri}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center gap-2 hover:underline"
						>
							<strong>{oauthClient.name}</strong>
							<ExternalLink className="h-4 w-4" />
						</a>
					</CardTitle>
					<CardDescription>
						is requesting access to your Remote MCP account.
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Redirect Information */}
					<div className="text-sm text-muted-foreground">
						<p>
							You will be redirected to:{" "}
							<a
								href={oauthClient.redirectUris[0]}
								target="_blank"
								rel="noopener noreferrer"
								className="font-mono break-all hover:underline"
							>
								{oauthClient.redirectUris[0]}
							</a>
						</p>
						<p className="mt-3">
							If you approve, {oauthClient.name} will be able to access your mcp
							servers and use its capabilities.
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col space-y-3">
						<Button onClick={() => authorize()} className="w-full">
							Approve Access
						</Button>
						<Button
							variant="outline"
							onClick={() => navigate({ to: "/" })}
							className="w-full"
						>
							Cancel
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
