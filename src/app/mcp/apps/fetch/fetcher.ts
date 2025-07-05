import { JSDOM } from "jsdom";
import isPrivateIp from "private-ip";
import TurndownService from "turndown";
import type { RequestPayload } from "./types";

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
		if (isPrivateIp(url)) {
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
