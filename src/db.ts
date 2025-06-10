import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";
import { env } from "./env";

let client: ReturnType<typeof neon>;
let db: ReturnType<typeof drizzle>;

export async function getClient() {
	if (!env.DATABASE_URL) {
		return undefined;
	}
	if (!client) {
		client = neon(env.DATABASE_URL);
	}
	return client;
}

export function getDb() {
	if (!env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}
	if (!db) {
		const sql = neon(env.DATABASE_URL);
		db = drizzle(sql, { schema });
	}
	return db;
}
