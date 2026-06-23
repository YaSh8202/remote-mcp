import { JSDOM } from "jsdom";
import isPrivateIp from "private-ip";
import TurndownService from "turndown";
import type { RequestPayload } from "./types";

/**
 * Supplements `private-ip`, which has no upstream fix for GHSA-9h3q-32c7-r533:
 * it omits the multicast range (224.0.0.0/4) and some other reserved blocks,
 * letting an attacker reach them to bypass SSRF protection. This blocks literal
 * IPv4/IPv6 addresses in reserved ranges that `private-ip` does not cover.
 */
function isReservedIp(input: string): boolean {
	let host = input;
	try {
		host = new URL(input).hostname;
	} catch {
		// not a full URL — treat the input as a bare host/IP
	}
	// strip IPv6 brackets, e.g. "[::1]" -> "::1"
	host = host.replace(/^\[|\]$/g, "");

	// IPv4 literal (also catches the IPv4 tail of IPv4-mapped IPv6, e.g. ::ffff:224.0.0.1)
	const v4 = host.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (v4) {
		const [a, b] = v4.slice(1).map(Number);
		if (a > 255 || b > 255) return false;
		if (a === 0) return true; // 0.0.0.0/8 "this host"
		if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
		if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved/broadcast
		return false;
	}

	// IPv6 multicast (ff00::/8)
	return /^ff[0-9a-f]{2}:/i.test(host);
}

function applyLengthLimits(
	text: string,
	maxLength: number,
	startIndex: number,
): string {
	if (startIndex >= text.length) {
		return "";
	}

	const end = Math.min(startIndex + maxLength, text.length);
	return text.substring(startIndex, end);
}

async function _fetch({ url, headers }: RequestPayload): Promise<Response> {
	try {
		if (isPrivateIp(url) || isReservedIp(url)) {
			throw new Error(
				`Fetcher blocked an attempt to fetch a private IP ${url}. This is to prevent a security vulnerability where a local MCP could fetch privileged local IPs and exfiltrate data.`,
			);
		}
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				...headers,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}
		return response;
	} catch (e: unknown) {
		if (e instanceof Error) {
			throw new Error(`Failed to fetch ${url}: ${e.message}`);
		}
		throw new Error(`Failed to fetch ${url}: Unknown error`);
	}
}

export async function fetchHtml(requestPayload: RequestPayload) {
	try {
		const response = await _fetch(requestPayload);
		let html = await response.text();

		// Apply length limits
		html = applyLengthLimits(
			html,
			requestPayload.max_length ?? 5000,
			requestPayload.start_index ?? 0,
		);

		return { content: [{ type: "text" as const, text: html }], isError: false };
	} catch (error) {
		return {
			content: [{ type: "text" as const, text: (error as Error).message }],
			isError: true,
		};
	}
}

export async function fetchJson(requestPayload: RequestPayload) {
	try {
		const response = await _fetch(requestPayload);
		const json = await response.json();
		let jsonString = JSON.stringify(json, null, 2);

		// Apply length limits
		jsonString = applyLengthLimits(
			jsonString,
			requestPayload.max_length ?? 5000,
			requestPayload.start_index ?? 0,
		);

		return {
			content: [{ type: "text" as const, text: jsonString }],
			isError: false,
		};
	} catch (error) {
		return {
			content: [{ type: "text" as const, text: (error as Error).message }],
			isError: true,
		};
	}
}

export async function fetchTxt(requestPayload: RequestPayload) {
	try {
		const response = await _fetch(requestPayload);
		const html = await response.text();

		const dom = new JSDOM(html);
		const document = dom.window.document;

		const scripts = document.getElementsByTagName("script");
		const styles = document.getElementsByTagName("style");
		for (const script of Array.from(scripts)) {
			script.remove();
		}
		for (const style of Array.from(styles)) {
			style.remove();
		}

		const text = document.body?.textContent || "";
		let normalizedText = text.replace(/\s+/g, " ").trim();

		// Apply length limits
		normalizedText = applyLengthLimits(
			normalizedText,
			requestPayload.max_length ?? 5000,
			requestPayload.start_index ?? 0,
		);

		return {
			content: [{ type: "text" as const, text: normalizedText }],
			isError: false,
		};
	} catch (error) {
		return {
			content: [{ type: "text" as const, text: (error as Error).message }],
			isError: true,
		};
	}
}

export async function fetchMarkdown(requestPayload: RequestPayload) {
	try {
		const response = await _fetch(requestPayload);
		const html = await response.text();
		const turndownService = new TurndownService();
		let markdown = turndownService.turndown(html);

		// Apply length limits
		markdown = applyLengthLimits(
			markdown,
			requestPayload.max_length ?? 5000,
			requestPayload.start_index ?? 0,
		);

		return {
			content: [{ type: "text" as const, text: markdown }],
			isError: false,
		};
	} catch (error) {
		return {
			content: [{ type: "text" as const, text: (error as Error).message }],
			isError: true,
		};
	}
}
