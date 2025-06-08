import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { signIn, useSession } from "../lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const { session } = useSession();
	const navigate = useNavigate();

	// Redirect if already authenticated
	useEffect(() => {
		if (session?.user) {
			navigate({ to: "/" });
		}
	}, [session, navigate]);

	const handleGoogleSignIn = async () => {
		try {
			await signIn.social({
				provider: "google",
				callbackURL: "/",
			});
		} catch (error) {
			console.error("Sign in error:", error);
		}
	};

	// Don't render if already authenticated (while navigating)
	if (session?.user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-lg">Redirecting...</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
					<CardDescription>Sign in to your account to continue</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Button
						onClick={handleGoogleSignIn}
						className="w-full"
						variant="outline"
					>
						Continue with Google
					</Button>

					<div className="text-center text-sm text-gray-600">
						By signing in, you agree to our Terms of Service and Privacy Policy
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
