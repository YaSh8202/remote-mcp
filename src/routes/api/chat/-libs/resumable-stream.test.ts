import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "@/db";
import { getResumableStreamContext } from "./resumable-stream";

/**
 * Integration test for the Postgres-backed `resumable-stream` adapter. Requires a
 * reachable Postgres (set DATABASE_URL). It creates the two backing tables if they
 * don't exist and exercises the public context API end to end.
 */

const context = getResumableStreamContext();

async function readAll(stream: ReadableStream<string>): Promise<string> {
	const reader = stream.getReader();
	let out = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		out += value;
	}
	return out;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
	await sql`
		CREATE TABLE IF NOT EXISTS stream_kv (
			key text PRIMARY KEY,
			value text NOT NULL,
			expires_at timestamptz
		)
	`;
	await sql`
		CREATE TABLE IF NOT EXISTS stream_messages (
			id bigserial PRIMARY KEY,
			channel text NOT NULL,
			message text NOT NULL,
			created_at timestamptz NOT NULL DEFAULT now()
		)
	`;
	await sql`
		CREATE INDEX IF NOT EXISTS stream_messages_channel_id_idx
		ON stream_messages (channel, id)
	`;
});

afterAll(async () => {
	await sql.end();
});

describe("resumable stream (postgres-backed)", () => {
	it("buffers a stream, marks it DONE, and refuses to recreate it", async () => {
		const streamId = `test-${crypto.randomUUID()}`;
		const stream = await context.createNewResumableStream(
			streamId,
			() =>
				new ReadableStream<string>({
					start(controller) {
						controller.enqueue("a");
						controller.enqueue("b");
						controller.enqueue("c");
						controller.close();
					},
				}),
		);

		expect(stream).not.toBeNull();
		expect(await readAll(stream as ReadableStream<string>)).toBe("abc");

		// The DONE sentinel is written asynchronously after the stream closes.
		await wait(150);
		expect(await context.hasExistingStream(streamId)).toBe("DONE");
		expect(await context.resumeExistingStream(streamId)).toBeNull();

		// `resumableStream` on a finished stream returns null (incr hits "DONE").
		const recreated = await context.resumableStream(
			streamId,
			() =>
				new ReadableStream<string>({
					start(controller) {
						controller.enqueue("z");
						controller.close();
					},
				}),
		);
		expect(recreated).toBeNull();
	});

	it("resumes an in-flight stream and replays buffered chunks", async () => {
		const streamId = `test-${crypto.randomUUID()}`;
		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});

		const stream = await context.createNewResumableStream(
			streamId,
			() =>
				new ReadableStream<string>({
					async start(controller) {
						controller.enqueue("hello ");
						await gate;
						controller.enqueue("world");
						controller.close();
					},
				}),
		);

		// Read the first chunk from the producer so it is buffered server-side.
		const producerReader = (stream as ReadableStream<string>).getReader();
		const first = await producerReader.read();
		expect(first.value).toBe("hello ");

		// A second client resumes mid-flight: it should receive the buffered chunk
		// and then the remaining live chunks.
		const resumed = await context.resumeExistingStream(streamId);
		expect(resumed).not.toBeNull();
		const resumedReader = (resumed as ReadableStream<string>).getReader();

		const buffered = await resumedReader.read();
		expect(buffered.value).toBe("hello ");

		release();
		const live = await resumedReader.read();
		expect(live.value).toBe("world");

		const end = await resumedReader.read();
		expect(end.done).toBe(true);
	});
});
