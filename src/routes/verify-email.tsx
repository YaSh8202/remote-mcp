import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { useUserSession } from "@/hooks/auth";
import { authClient } from "@/lib/auth-client";
import { authQueries } from "@/services/queries";

export const Route = createFileRoute("/verify-email")({
	component: VerifyEmailPage,
	beforeLoad: ({ context }) => {
		if (!context.userSession?.user) {
			throw redirect({
				to: "/login",
			});
		}

		if (context.userSession?.user.emailVerified) {
			throw redirect({
				to: "/servers",
			});
		}
	},
});

export default function VerifyEmailPage() {
	const router = useRouter();
	const [otp, setOtp] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [isSigningOut, setIsSigningOut] = useState(false);
	const queryClient = useQueryClient();

	// Get email from user session
	const email = useUserSession().user?.email;

	const handleUseAnotherAccount = async () => {
		setIsSigningOut(true);
		try {
			await authClient.signOut();
			toast.success("Signed out successfully");
			router.navigate({ to: "/login" });
		} catch (error) {
			console.error("Sign out error:", error);
			toast.error("Failed to sign out. Please try again.");
		} finally {
			setIsSigningOut(false);
		}
	};

	const handleVerify = async () => {
		if (otp.length !== 6) {
			toast.error("Please enter a 6-digit code");
			return;
		}

		setIsVerifying(true);
		try {
			const { error } = await authClient.emailOtp.verifyEmail({
				email,
				otp,
			});

			if (error) {
				if (error.status === 403) {
					toast.error("Too many attempts. Please request a new code.");
				} else {
					toast.error(error.message || "Invalid or expired code");
				}
				setOtp("");
				return;
			}

			toast.success("Email verified successfully!");

			queryClient.invalidateQueries(authQueries.user());

			// Redirect to dashboard or home
			router.navigate({ to: "/servers" });
		} catch (error) {
			console.error("Verification error:", error);
			toast.error("An error occurred. Please try again.");
		} finally {
			setIsVerifying(false);
		}
	};

	const handleResend = async () => {
		if (!email) {
			toast.error("No email address found");
			return;
		}

		setIsResending(true);
		try {
			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: "email-verification",
			});

			if (error) {
				toast.error(error.message || "Failed to resend code");
				return;
			}

			toast.success("Verification code sent!");
			setOtp("");
		} catch (error) {
			console.error("Resend error:", error);
			toast.error("An error occurred. Please try again.");
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl font-bold">
						Verify Your Email
					</CardTitle>
					<CardDescription className="space-y-2">
						<div>
							We've sent a 6-digit code to
							<br />
							<strong className="text-foreground text-base">{email}</strong>
						</div>
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex flex-col items-center space-y-4">
						<InputOTP
							maxLength={6}
							value={otp}
							onChange={setOtp}
							onComplete={handleVerify}
							disabled={isVerifying}
						>
							<InputOTPGroup>
								<InputOTPSlot index={0} />
								<InputOTPSlot index={1} />
								<InputOTPSlot index={2} />
								<InputOTPSlot index={3} />
								<InputOTPSlot index={4} />
								<InputOTPSlot index={5} />
							</InputOTPGroup>
						</InputOTP>

						<p className="text-muted-foreground text-center text-sm">
							Enter the verification code sent to your email
						</p>
					</div>

					<Button
						onClick={handleVerify}
						disabled={otp.length !== 6 || isVerifying}
						className="w-full"
					>
						{isVerifying ? "Verifying..." : "Verify Email"}
					</Button>

					<div className="flex flex-col items-center gap-2">
						<Button
							variant="link"
							onClick={handleResend}
							disabled={isResending}
							className="text-sm"
						>
							{isResending ? "Sending..." : "Didn't receive the code? Resend"}
						</Button>

						<Button
							variant="ghost"
							onClick={handleUseAnotherAccount}
							disabled={isSigningOut}
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							{isSigningOut ? "Signing out..." : "Use another account"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
