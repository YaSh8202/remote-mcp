import {
	createResumableStreamContext,
	type Publisher,
	type Subscriber,
} from "resumable-stream/generic";
import { sql } from "@/db";

/**
 * Postgres-backed implementation of the `resumable-stream` generic pub/sub
 * interface.
 *
 * The app deploys to Vercel serverless functions and only has Postgres available
 * (no Redis). Postgres LISTEN/NOTIFY is not usable through serverless connection
 * poolers, so this adapter emulates the Redis primitives the library relies on
 * using two small tables:
 *
 *  - `stream_kv`       — the key/value store used for the per-stream "sentinel"
 *                        (a listener counter that flips to `DONE` when the
 *                        producer finishes) and its 24h expiry.
 *  - `stream_messages` — an append-only log that backs pub/sub. Subscribers poll
 *                        for rows newer than the last id they saw on a channel.
 *
 * The polling interval is deliberately short (see `POLL_INTERVAL_MS`) because the
 * library's `resumeStream` gives up if it does not receive an ack within 1000ms.
 */

/** How often each subscriber polls its channel for new messages. */
const POLL_INTERVAL_MS = 150;

/** How often the background cleanup job runs. */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Redis-like publisher backed by Postgres. Implements the subset of the Redis
 * command surface that `resumable-stream` uses.
 */
class PostgresPublisher implements Publisher {
	async connect(): Promise<void> {
		// postgres.js connects lazily; nothing to do here.
	}

	async publish(channel: string, message: string): Promise<number> {
		await sql`
			INSERT INTO stream_messages (channel, message)
			VALUES (${channel}, ${message})
		`;
		// Redis returns the number of receivers; the library ignores the value.
		return 0;
	}

	async set(
		key: string,
		value: string,
		options?: { EX?: number },
	): Promise<"OK"> {
		// Send the expiry as an ISO string with an explicit cast rather than a Date
		// object: postgres.js infers parameter types via `instanceof Date`, which is
		// unreliable across realms (e.g. under Vitest), and would otherwise send the
		// value as an array type and fail to serialize it.
		const expiresAt = options?.EX
			? new Date(Date.now() + options.EX * 1000).toISOString()
			: null;
		await sql`
			INSERT INTO stream_kv (key, value, expires_at)
			VALUES (${key}, ${value}, ${expiresAt}::timestamptz)
			ON CONFLICT (key) DO UPDATE
			SET value = ${value}, expires_at = ${expiresAt}::timestamptz
		`;
		return "OK";
	}

	async get(key: string): Promise<string | null> {
		const rows = await sql<{ value: string }[]>`
			SELECT value
			FROM stream_kv
			WHERE key = ${key}
				AND (expires_at IS NULL OR expires_at > now())
			LIMIT 1
		`;
		return rows[0]?.value ?? null;
	}

	/**
	 * Atomically increments the integer stored at `key`, creating it with value 1
	 * when absent (or expired). When the stored value is the non-numeric `DONE`
	 * sentinel the `::bigint` cast fails; we translate that into the exact Redis
	 * error string `resumable-stream`'s `incrOrDone` looks for so it can detect
	 * that the stream has finished.
	 */
	async incr(key: string): Promise<number> {
		try {
			const rows = await sql<{ value: string }[]>`
				INSERT INTO stream_kv (key, value, expires_at)
				VALUES (${key}, '1', NULL)
				ON CONFLICT (key) DO UPDATE
				SET value = CASE
						WHEN stream_kv.expires_at IS NOT NULL
							AND stream_kv.expires_at <= now()
							THEN '1'
						ELSE (stream_kv.value::bigint + 1)::text
					END,
					expires_at = CASE
						WHEN stream_kv.expires_at IS NOT NULL
							AND stream_kv.expires_at <= now()
							THEN NULL
						ELSE stream_kv.expires_at
					END
				RETURNING value
			`;
			return Number(rows[0]?.value ?? "1");
		} catch (error) {
			// 22P02 = invalid_text_representation (e.g. casting "DONE" to bigint).
			if ((error as { code?: string }).code === "22P02") {
				throw new Error("ERR value is not an integer or out of range");
			}
			throw error;
		}
	}
}

/**
 * Redis-like subscriber backed by Postgres. Each subscription runs a polling
 * loop that reads new rows from `stream_messages` for its channel and invokes
 * the callback in id order.
 */
class PostgresSubscriber implements Subscriber {
	private readonly subscriptions = new Map<
		string,
		{ timer: ReturnType<typeof setInterval>; lastId: number }
	>();

	async connect(): Promise<void> {
		// postgres.js connects lazily; nothing to do here.
	}

	async subscribe(
		channel: string,
		callback: (message: string) => void,
	): Promise<void> {
		if (this.subscriptions.has(channel)) return;

		// Only deliver messages published after this subscription starts, matching
		// Redis pub/sub semantics. Reading the current max id first also closes the
		// race where a message is published between subscribing and the first poll.
		const rows = await sql<{ maxId: number | null }[]>`
			SELECT MAX(id) AS "maxId"
			FROM stream_messages
			WHERE channel = ${channel}
		`;
		const state = {
			timer: undefined as unknown as ReturnType<typeof setInterval>,
			lastId: Number(rows[0]?.maxId ?? 0),
		};
		this.subscriptions.set(channel, state);

		let polling = false;
		state.timer = setInterval(async () => {
			// Skip if the previous poll is still in flight (slow DB).
			if (polling) return;
			polling = true;
			try {
				const messages = await sql<{ id: number; message: string }[]>`
					SELECT id, message
					FROM stream_messages
					WHERE channel = ${channel} AND id > ${state.lastId}
					ORDER BY id ASC
				`;
				for (const row of messages) {
					state.lastId = Number(row.id);
					callback(row.message);
				}
			} catch (error) {
				console.error("resumable-stream subscriber poll failed:", error);
			} finally {
				polling = false;
			}
		}, POLL_INTERVAL_MS);
		// Don't keep the process alive just for polling.
		state.timer.unref?.();
	}

	async unsubscribe(channel: string): Promise<void> {
		const state = this.subscriptions.get(channel);
		if (!state) return;
		clearInterval(state.timer);
		this.subscriptions.delete(channel);
	}
}

let cleanupStarted = false;

/**
 * Best-effort background cleanup of expired sentinels and old pub/sub messages so
 * the two tables don't grow unbounded. Runs on a timer that is unref'd so it never
 * keeps the process alive; in serverless it simply runs whenever an instance is warm.
 */
function startCleanup(): void {
	if (cleanupStarted) return;
	cleanupStarted = true;
	const timer = setInterval(async () => {
		try {
			await sql`
				DELETE FROM stream_messages
				WHERE created_at < now() - interval '1 hour'
			`;
			await sql`
				DELETE FROM stream_kv
				WHERE expires_at IS NOT NULL AND expires_at < now()
			`;
		} catch (error) {
			console.error("resumable-stream cleanup failed:", error);
		}
	}, CLEANUP_INTERVAL_MS);
	timer.unref?.();
}

let contextSingleton:
	| ReturnType<typeof createResumableStreamContext>
	| undefined;

/**
 * Returns the process-wide resumable stream context. `waitUntil` is `null` because
 * the producer stream is driven by the response body itself (the SSE stream is
 * tee'd and the resumable producer consumes one branch), so there is no separate
 * background task to keep alive.
 */
export function getResumableStreamContext(): ReturnType<
	typeof createResumableStreamContext
> {
	if (!contextSingleton) {
		startCleanup();
		contextSingleton = createResumableStreamContext({
			waitUntil: null,
			publisher: new PostgresPublisher(),
			subscriber: new PostgresSubscriber(),
		});
	}
	return contextSingleton;
}
