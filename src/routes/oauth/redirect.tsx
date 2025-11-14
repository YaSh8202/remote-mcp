import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { RemoteMcpLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/oauth/redirect")({
	component: OAuthRedirectPage,
});

function OAuthRedirectPage() {
	const navigate = useNavigate();
	const [redirecting, setRedirecting] = useState(true);
	const [redirectUrl, setRedirectUrl] = useState<string>("");

	useEffect(() => {
		// Get the current URL parameters
		const params = new URLSearchParams(window.location.search);

		// Perform the OAuth redirect
		const redirectToOAuth = async () => {
			try {
				// Build the OAuth authorization URL
				const oauthUrl = `/api/oauth/authorize?${params.toString()}`;
				setRedirectUrl(oauthUrl);

				// Redirect to the OAuth endpoint
				window.location.href = oauthUrl;
			} catch (error) {
				console.error("OAuth redirect error:", error);
			}
			setRedirecting(false);
		};

		// Small delay to show the redirecting state
		const timer = setTimeout(() => {
			redirectToOAuth();
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	const handleTryAgain = () => {
		if (redirectUrl) {
			window.location.href = redirectUrl;
		}
	};

	return (
		<div className="min-h-screen flex flex-col space-y-5 items-center justify-center p-4">
			<div className="flex items-center space-x-3 mb-4">
				<RemoteMcpLogo className="size-12 fill-white" />
				<h1 className="text-2xl font-bold">Remote MCP</h1>
			</div>

			<Card className="w-full max-w-lg">
				<CardHeader className="text-center">
					<div className="flex items-center justify-center mb-4">
						{redirecting ? (
							<RefreshCw className="h-12 w-12 text-blue-600 animate-spin" />
						) : (
							<CheckCircle className="h-12 w-12 text-green-600" />
						)}
					</div>
					<CardTitle className="text-2xl">
						{redirecting ? "Redirecting..." : "Authorization Complete"}
					</CardTitle>
					<CardDescription>
						{redirecting
							? "Please wait while we redirect you to your application."
							: "You have successfully authorized the application."}
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{redirecting ? (
						<div className="text-center text-sm text-muted-foreground">
							<p>You will be redirected to your application shortly.</p>
							<p className="mt-2">This may take a few seconds...</p>
						</div>
					) : (
						<div className="space-y-4">
							<div className="text-center text-sm text-muted-foreground">
								<p className="font-medium text-green-600 mb-2">
									✓ Authorization successful!
								</p>
								<p>
									You can now close this tab and return to your application.
								</p>
								<p className="mt-2">
									If you weren't automatically redirected, you can try again
									below.
								</p>
							</div>

							<div className="flex flex-col space-y-3">
								<Button
									onClick={handleTryAgain}
									className="w-full"
									variant="default"
								>
									<ExternalLink className="h-4 w-4 mr-2" />
									Try Redirect Again
								</Button>
								<Button
									variant="outline"
									onClick={() => navigate({ to: "/" })}
									className="w-full"
								>
									Return to Dashboard
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
