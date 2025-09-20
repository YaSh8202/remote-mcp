import { MdiGithub } from "@/app/mcp/apps/icons";
import { GoogleIcon, RemoteMcpLogo } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { signIn, signUp } from "../lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	beforeLoad: async ({ context }) => {
		if (context.userSession?.user) {
			throw redirect({
				to: "/servers",
			});
		}
	},
	validateSearch: z.object({
		from: z.string().optional(),
	}),
});

// Schema for form validation
const signInSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

function LoginPage() {
	const navigate = useNavigate();
	const [isSignUp, setIsSignUp] = useState(false);
	const search = Route.useSearch();

	const callbackURL = search.from || "/servers";

	const form = useForm<SignInFormData | SignUpFormData>({
		resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
		defaultValues: {
			email: "",
			password: "",
			...(isSignUp && { name: "" }),
		},
	});

	const handleGoogleSignIn = async () => {
		try {
			await signIn.social({
				provider: "google",
				callbackURL,
			});
		} catch (error) {
			console.error("Google sign in error:", error);
		}
	};

	const handleGitHubSignIn = async () => {
		try {
			await signIn.social({
				provider: "github",
				callbackURL,
			});
		} catch (error) {
			console.error("GitHub sign in error:", error);
		}
	};

	const handleEmailAuth = async (data: SignInFormData | SignUpFormData) => {
		try {
			if (isSignUp) {
				const signUpData = data as SignUpFormData;
				await signUp.email({
					email: signUpData.email,
					password: signUpData.password,
					name: signUpData.name,
					callbackURL,
				});
			} else {
				const signInData = data as SignInFormData;
				await signIn.email({
					email: signInData.email,
					password: signInData.password,
					callbackURL,
				});
			}
			navigate({ to: "/servers" });
		} catch (error) {
			console.error("Email auth error:", error);
		}
	};

	const googleSignInMutation = useMutation({
		mutationFn: handleGoogleSignIn,
		onSuccess: () => {
			navigate({ to: "/" });
		},
	});

	const githubSignInMutation = useMutation({
		mutationFn: handleGitHubSignIn,
		onSuccess: () => {
			navigate({ to: "/" });
		},
	});

	const emailAuthMutation = useMutation({
		mutationFn: handleEmailAuth,
		onSuccess: () => {
			navigate({ to: "/" });
		},
	});

	// Reset form when switching between sign in and sign up
	const handleToggleMode = () => {
		setIsSignUp(!isSignUp);
		form.reset({
			email: "",
			password: "",
			...(isSignUp && { name: "" }),
		});
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-secondary/70">
			<div className="flex flex-col gap-6 w-full max-w-md">
				<Card>
					<CardHeader className="text-center">
						<div className="flex justify-center mb-2">
							<RemoteMcpLogo className="h-16 w-16 text-primary" />
						</div>
						<CardTitle className="text-xl">
							{isSignUp ? "Create an account" : "Welcome back"}
						</CardTitle>
						<CardDescription>
							{isSignUp
								? "Sign up with your GitHub or Google account"
								: "Login with your GitHub or Google account"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-6">
							<div className="flex flex-col gap-4">
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() => githubSignInMutation.mutate()}
									disabled={githubSignInMutation.isPending}
								>
									{githubSignInMutation.isPending && <LoadingSpinner />}
									<MdiGithub className="h-4 w-4 mr-2" />
									Login with GitHub
								</Button>
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() => googleSignInMutation.mutate()}
									disabled={googleSignInMutation.isPending}
								>
									{googleSignInMutation.isPending && <LoadingSpinner />}
									<GoogleIcon className="h-4 w-4 mr-2" />
									Login with Google
								</Button>
							</div>
							<div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
								<span className="relative z-10 bg-card px-2 text-muted-foreground">
									Or continue with
								</span>
							</div>
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit((data) =>
										emailAuthMutation.mutate(data),
									)}
									className="grid gap-6"
								>
									{isSignUp && (
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Name</FormLabel>
													<FormControl>
														<Input placeholder="John Doe" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														type="email"
														placeholder="m@example.com"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input type="password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										type="submit"
										className="w-full"
										disabled={emailAuthMutation.isPending}
									>
										{emailAuthMutation.isPending && <LoadingSpinner />}
										{isSignUp ? "Create Account" : "Login"}
									</Button>
								</form>
							</Form>
							<div className="text-center text-sm">
								{isSignUp
									? "Already have an account?"
									: "Don't have an account?"}{" "}
								<button
									type="button"
									onClick={handleToggleMode}
									className="underline underline-offset-4 hover:text-primary"
								>
									{isSignUp ? "Sign in" : "Sign up"}
								</button>
							</div>
						</div>
					</CardContent>
				</Card>
				<div className="text-center text-xs text-balance text-muted-foreground">
					By clicking continue, you agree to our{" "}
					<button
						type="button"
						className="underline underline-offset-4 hover:text-primary"
						onClick={() => {
							console.log("Terms of Service clicked");
						}}
					>
						Terms of Service
					</button>{" "}
					and{" "}
					<button
						type="button"
						className="underline underline-offset-4 hover:text-primary"
						onClick={() => {
							console.log("Privacy Policy clicked");
						}}
					>
						Privacy Policy
					</button>
					.
				</div>
			</div>
		</div>
	);
}
