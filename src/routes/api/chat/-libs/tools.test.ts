import { describe, expect, it } from "vitest";
import { flattenToolsets } from "./tools";

// Minimal stand-in for an MCP tool; flattenToolsets only moves references around,
// so the exact shape is irrelevant — identity is what we assert on.
const tool = (label: string) => ({ label }) as never;

describe("flattenToolsets", () => {
	it("flattens server-grouped toolsets into a single record with bare names", () => {
		const a = tool("a");
		const b = tool("b");
		const flat = flattenToolsets({
			s0: { listIssues: a },
			s1: { sendMessage: b },
		});

		expect(Object.keys(flat).sort()).toEqual(["listIssues", "sendMessage"]);
		expect(flat.listIssues).toBe(a);
		expect(flat.sendMessage).toBe(b);
	});

	it("prefixes the colliding key with its server key, keeping the first bare", () => {
		const first = tool("first");
		const second = tool("second");
		const flat = flattenToolsets({
			s0: { query: first },
			s1: { query: second },
		});

		// First occurrence keeps the bare name; the duplicate is server-prefixed.
		expect(flat.query).toBe(first);
		expect(flat.s1_query).toBe(second);
		expect(Object.keys(flat).sort()).toEqual(["query", "s1_query"]);
	});

	it("returns an empty record for empty toolsets", () => {
		expect(flattenToolsets({})).toEqual({});
	});
});
