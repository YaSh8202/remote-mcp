import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useOAuthClient } from "@/hooks/use-oauth-client";
import { authQueries } from "@/services/queries";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { AlertTriangle, ExternalLink, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod/v4";

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

	// Parse requested scopes from the URL
	const scopeParam = search.scope || "";

	const scopes = [
		{
			value: "read",
			label: "Allow application to read your profile and MCP servers",
		},
		{
			value: "write",
			label: "Allow application to create and manage MCP servers",
		},
	];

	// State for selected scopes
	const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

	// Update selected scopes when scope param changes
	useEffect(() => {
		const newRequestedScopes = scopeParam
			.split(" ")
			.filter(Boolean)
			.flatMap((scope: string) => scope.split("+"));
		setSelectedScopes(newRequestedScopes);
	}, [scopeParam]);

	const handleScopeChange = (scope: string, checked: boolean) => {
		if (scope === "read") {
			if (!checked) {
				// If unchecking 'read', also uncheck 'write'
				setSelectedScopes((prev) =>
					prev.filter((s) => s !== "read" && s !== "write"),
				);
			} else {
				setSelectedScopes((prev) =>
					prev.includes("read") ? prev : [...prev, "read"],
				);
			}
		} else if (scope === "write") {
			if (checked) {
				// If checking 'write', ensure 'read' is also checked
				setSelectedScopes((prev) => {
					const next = [...prev];
					if (!next.includes("read")) next.push("read");
					if (!next.includes("write")) next.push("write");
					return next;
				});
			} else {
				setSelectedScopes((prev) => prev.filter((s) => s !== "write"));
			}
		}
	};

	const authorize = async (selectedScopes: string[]) => {
		// Build new search params with selected scopes
		const params = new URLSearchParams(window.location.search);
		params.set("scope", selectedScopes.join(" "));
		window.location.href = `/api/oauth/authorize?${params.toString()}`;
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
		window.location.href = `/login?returnUrl=${returnUrl}`;
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

	const isInsecureRedirect =
		!oauthClient.redirectUris[0]?.startsWith("https") &&
		!oauthClient.redirectUris[0]?.startsWith("http://localhost:") &&
		!oauthClient.redirectUris[0]?.startsWith("http://localhost/");

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
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
					{/* Scopes Section */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Permissions</h3>
						<div className="space-y-3">
							{scopes.map((scope) => (
								<div key={scope.value} className="flex items-start space-x-3">
									<Checkbox
										id={scope.value}
										checked={selectedScopes.includes(scope.value)}
										onCheckedChange={(checked) =>
											handleScopeChange(scope.value, checked === true)
										}
										disabled={
											scope.value === "write" &&
											!selectedScopes.includes("read")
										}
									/>
									<label
										htmlFor={scope.value}
										className="text-sm font-medium leading-6 cursor-pointer"
									>
										{scope.label}
									</label>
								</div>
							))}
						</div>
					</div>

					{/* Security Warning */}
					{isInsecureRedirect && (
						<Alert variant="destructive">
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription>
								This application will redirect to an insecure URL that may
								expose your access token.
							</AlertDescription>
						</Alert>
					)}

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
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col space-y-3">
						<Button
							onClick={() => authorize(selectedScopes)}
							disabled={selectedScopes.length === 0}
							className="w-full"
						>
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
