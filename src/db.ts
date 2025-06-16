import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";
import { env } from "./env";

let client: ReturnType<typeof neon>;

export function getClient() {
	if (!env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}
	if (!client) {
		client = neon(env.DATABASE_URL);
	}
	return client;
}

export const db = drizzle(getClient(), { schema });
