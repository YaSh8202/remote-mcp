import { LoadingSpinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { signIn } from "../lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	beforeLoad: async ({ context }) => {
		if (context.userSession?.user) {
			throw redirect({
				to: "/",
			});
		}
	},
});

function LoginPage() {
	const navigate = useNavigate();
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

	const socialSignInMutation = useMutation({
		mutationFn: handleGoogleSignIn,
		onSuccess: () => {
			// Handle successful sign-in, e.g., redirect or show a success message
			navigate({ to: "/" });
		},
	});

	return (
		<div className="flex min-h-screen items-center justify-center bg-secondary/70">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
					<CardDescription>Sign in to your account to continue</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Button
						onClick={() => socialSignInMutation.mutate()}
						disabled={socialSignInMutation.isPending}
						className="w-full"
						variant="outline"
					>
						{socialSignInMutation.isPending && <LoadingSpinner />}
						Continue with Google
					</Button>

					<div className="text-center text-sm text-muted-foreground">
						By signing in, you agree to our Terms of Service and Privacy Policy
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
