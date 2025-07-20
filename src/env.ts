import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		SERVER_URL: z.string().url().optional(),
		DATABASE_URL: z.string().min(1),
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
		GITHUB_CLIENT_ID: z.string().min(1).optional(),
		GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
		BETTER_AUTH_SECRET: z.string().min(1),
		BETTER_AUTH_URL: z
			.string()
			.url()
			.optional()
			.default("http://localhost:3000"),
		SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
		OAUTH_APP_SECRETS: z.string().optional(),
		ENCRYPTION_KEY: z.string().min(1),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_",

	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
		VITE_SENTRY_DSN: z.string().url().optional(),
		VITE_SENTRY_ORG: z.string().min(1).optional(),
		VITE_SENTRY_PROJECT: z.string().min(1).optional(),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: typeof window === "undefined" ? process.env : import.meta.env,

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});

/**
 * Parse OAuth app secrets from the environment variable
 * @returns Record of app names to their client credentials
 */
export function getOAuthAppSecrets(): Record<
	string,
	{ clientId: string; clientSecret: string }
> {
	if (!env.OAUTH_APP_SECRETS) {
		return {};
	}

	try {
		const parsed = JSON.parse(env.OAUTH_APP_SECRETS);

		// Validate the structure of the parsed JSON
		if (typeof parsed !== "object" || parsed === null) {
			console.warn("OAUTH_APP_SECRETS is not a valid object");
			return {};
		}

		// Validate each entry has the required structure
		for (const [key, value] of Object.entries(parsed)) {
			if (
				typeof value !== "object" ||
				value === null ||
				!("clientId" in value) ||
				!("clientSecret" in value) ||
				typeof value.clientId !== "string" ||
				typeof value.clientSecret !== "string"
			) {
				console.warn(`Invalid OAuth app secret structure for key: ${key}`);
				delete parsed[key];
			}
		}

		return parsed as Record<string, { clientId: string; clientSecret: string }>;
	} catch (error) {
		console.error("Failed to parse OAUTH_APP_SECRETS:", error);
		return {};
	}
}
