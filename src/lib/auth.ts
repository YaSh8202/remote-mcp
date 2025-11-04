import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { reactStartCookies } from "better-auth/react-start";
import { db } from "../db";
import * as schema from "../db/schema";
import { env } from "../env";
import { sendOTPEmail } from "./email-service";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 10,
	},
	socialProviders: {
		...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: env.GOOGLE_CLIENT_ID,
						clientSecret: env.GOOGLE_CLIENT_SECRET,
					},
				}
			: {}),
		...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
			? {
					github: {
						clientId: env.GITHUB_CLIENT_ID,
						clientSecret: env.GITHUB_CLIENT_SECRET,
					},
				}
			: {}),
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day (update session every day)
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	plugins: [
		reactStartCookies(),
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				await sendOTPEmail({
					to: email,
					otp,
					type,
				});
			},
			otpLength: 6,
			expiresIn: 600, // 5 minutes
			allowedAttempts: 5,

			sendVerificationOnSignUp: true,
			overrideDefaultEmailVerification: true,
		}),
	],
});
