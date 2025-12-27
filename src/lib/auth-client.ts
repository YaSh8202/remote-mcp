import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

export const authClient = createAuthClient({
	baseURL:
		typeof window !== "undefined" ? window.location.origin : env.SERVER_URL,
	plugins: [emailOTPClient()],
});

export const { signIn, signOut, signUp } = authClient;
