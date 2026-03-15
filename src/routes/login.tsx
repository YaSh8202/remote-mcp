import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { MdiGithub } from "@/app/mcp/apps/icons";
import { GoogleIcon, RemoteMcpLogo } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/spinner";
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

const afterLoginRedirect = "/chat";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	beforeLoad: async ({ context }) => {
		if (context.userSession?.user) {
			throw redirect({
				to: afterLoginRedirect,
			});
		}
	},
	validateSearch: z.object({
		from: z.string().optional(),
	}),
});

const signInSchema = z.object({
	email: z.email({ error: "Please enter a valid email address" }),
	password: z
		.string()
		.min(8, { error: "Password must be at least 8 characters" }),
});

const signUpSchema = z
	.object({
		name: z
			.string()
			.min(2, { error: "Name must be at least 2 characters" })
			.max(50, { error: "Name must be at most 50 characters" }),
		email: z.email({ error: "Please enter a valid email address" }),
		password: z
			.string()
			.min(8, { error: "Password must be at least 8 characters" })
			.max(128, { error: "Password must be at most 128 characters" }),
		confirmPassword: z.string(),
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.confirmPassword) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Passwords do not match",
				path: ["confirmPassword"],
			});
		}
	});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

// ---- Sign-In Form ----

interface SignInFormProps {
	callbackURL: string;
	onToggle: () => void;
}

function SignInForm({ callbackURL, onToggle }: SignInFormProps) {
	const navigate = useNavigate();
	const form = useForm<SignInFormData>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: "", password: "" },
	});

	const mutation = useMutation({
		mutationFn: async (data: SignInFormData) => {
			await signIn.email(
				{ email: data.email, password: data.password, callbackURL },
				{
					onError: (ctx) => {
						if (ctx.error.status === 403) {
							navigate({ to: "/verify-email" });
							return;
						}
						throw new Error(ctx.error.message);
					},
				},
			);
		},
		onSuccess: () => {
			navigate({ to: afterLoginRedirect });
		},
		onError: (error: Error) => {
			toast.error("Sign In Failed", {
				description:
					error.message || "Failed to sign in. Please check your credentials.",
			});
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
				className="grid gap-6"
			>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									type="email"
									autoFocus
									placeholder="m@example.com"
									autoComplete="email"
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
								<Input
									type="password"
									autoComplete="current-password"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="w-full" disabled={mutation.isPending}>
					{mutation.isPending && <LoadingSpinner />}
					Login
				</Button>
				<div className="text-center text-sm">
					Don&apos;t have an account?{" "}
					<button
						type="button"
						onClick={onToggle}
						className="underline underline-offset-4 hover:text-primary"
					>
						Sign up
					</button>
				</div>
			</form>
		</Form>
	);
}

// ---- Sign-Up Form ----

interface SignUpFormProps {
	callbackURL: string;
	onToggle: () => void;
}

function SignUpForm({ callbackURL, onToggle }: SignUpFormProps) {
	const navigate = useNavigate();
	const form = useForm<SignUpFormData>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
	});

	const mutation = useMutation({
		mutationFn: async (data: SignUpFormData) => {
			await signUp.email(
				{
					email: data.email,
					password: data.password,
					name: data.name,
					callbackURL,
				},
				{
					onError: (ctx) => {
						throw new Error(ctx.error.message);
					},
				},
			);
		},
		onSuccess: () => {
			navigate({ to: "/verify-email" });
		},
		onError: (error: Error) => {
			toast.error("Sign Up Failed", {
				description:
					error.message || "Failed to create account. Please try again.",
			});
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
				className="grid gap-6"
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input
									placeholder="John Doe"
									autoComplete="name"
									autoFocus
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
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
									autoComplete="email"
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
								<Input type="password" autoComplete="new-password" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Confirm Password</FormLabel>
							<FormControl>
								<Input type="password" autoComplete="new-password" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="w-full" disabled={mutation.isPending}>
					{mutation.isPending && <LoadingSpinner />}
					Create Account
				</Button>
				<div className="text-center text-sm">
					Already have an account?{" "}
					<button
						type="button"
						onClick={onToggle}
						className="underline underline-offset-4 hover:text-primary"
					>
						Sign in
					</button>
				</div>
			</form>
		</Form>
	);
}

// ---- Login Page ----

function LoginPage() {
	const navigate = useNavigate();
	const [isSignUp, setIsSignUp] = useState(false);
	const search = Route.useSearch();

	const callbackURL = search.from || afterLoginRedirect;

	const googleSignInMutation = useMutation({
		mutationFn: async () => {
			await signIn.social({ provider: "google", callbackURL });
		},
		onSuccess: () => {
			navigate({ to: afterLoginRedirect });
		},
		onError: (error: Error) => {
			toast.error("Google Sign In Failed", {
				description:
					error.message || "Failed to sign in with Google. Please try again.",
			});
		},
	});

	const githubSignInMutation = useMutation({
		mutationFn: async () => {
			await signIn.social({ provider: "github", callbackURL });
		},
		onSuccess: () => {
			navigate({ to: afterLoginRedirect });
		},
		onError: (error: Error) => {
			toast.error("GitHub Sign In Failed", {
				description:
					error.message || "Failed to sign in with GitHub. Please try again.",
			});
		},
	});

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
							{isSignUp ? (
								<SignUpForm
									callbackURL={callbackURL}
									onToggle={() => setIsSignUp(false)}
								/>
							) : (
								<SignInForm
									callbackURL={callbackURL}
									onToggle={() => setIsSignUp(true)}
								/>
							)}
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
