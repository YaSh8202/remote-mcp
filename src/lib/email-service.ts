import { Resend } from "resend";
import { env } from "../env";
import { OTPEmail } from "./email-templates/otp-email";

const resend = new Resend(env.RESEND_API_KEY);

export interface SendOTPEmailOptions {
	to: string;
	otp: string;
	type: "email-verification" | "sign-in" | "forget-password";
}

/**
 * Sends an OTP email using Resend and React Email templates
 */
export async function sendOTPEmail({
	to,
	otp,
	type,
}: SendOTPEmailOptions): Promise<{ success: boolean; error?: string }> {
	try {
		const { error } = await resend.emails.send({
			from: "Remote MCP <noreply@notifications.remotemcp.tech>",
			to,
			subject: getEmailSubject(type),
			react: OTPEmail({ otp, type }),
		});

		if (error) {
			console.error("Failed to send OTP email:", error);
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (error) {
		console.error("Error sending OTP email:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

function getEmailSubject(
	type: "email-verification" | "sign-in" | "forget-password",
): string {
	switch (type) {
		case "email-verification":
			return "Verify Your Email - Remote MCP";
		case "sign-in":
			return "Your Sign In Code - Remote MCP";
		case "forget-password":
			return "Reset Your Password - Remote MCP";
		default:
			return "Verification Code - Remote MCP";
	}
}
