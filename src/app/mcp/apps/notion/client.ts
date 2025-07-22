/**
 * Notion API client wrapper for MCP One
 * Based on the suekou/mcp-notion-server implementation
 */

import type {
	BlockResponse,
	CommentResponse,
	DatabaseResponse,
	ListResponse,
	NotionResponse,
	PageResponse,
	RichTextItemResponse,
	UserResponse,
} from "./types";

export class NotionClientWrapper {
	private notionToken: string;
	private baseUrl = "https://api.notion.com/v1";
	private headers: { [key: string]: string };

	constructor(token: string) {
		this.notionToken = token;
		this.headers = {
			Authorization: `Bearer ${this.notionToken}`,
			"Content-Type": "application/json",
			"Notion-Version": "2022-06-28",
		};
	}

	// Block operations
	async appendBlockChildren(
		block_id: string,
		children: Partial<BlockResponse>[],
	): Promise<BlockResponse> {
		const body = { children };

		const response = await fetch(
			`${this.baseUrl}/blocks/${block_id}/children`,
			{
				method: "PATCH",
				headers: this.headers,
				body: JSON.stringify(body),
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async retrieveBlock(block_id: string): Promise<BlockResponse> {
		const response = await fetch(`${this.baseUrl}/blocks/${block_id}`, {
			method: "GET",
			headers: this.headers,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async retrieveBlockChildren(
		block_id: string,
		start_cursor?: string,
		page_size?: number,
	): Promise<ListResponse> {
		const params = new URLSearchParams();
		if (start_cursor) params.append("start_cursor", start_cursor);
		if (page_size) params.append("page_size", page_size.toString());

		const response = await fetch(
			`${this.baseUrl}/blocks/${block_id}/children?${params}`,
			{
				method: "GET",
				headers: this.headers,
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async deleteBlock(block_id: string): Promise<BlockResponse> {
		const response = await fetch(`${this.baseUrl}/blocks/${block_id}`, {
			method: "DELETE",
			headers: this.headers,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async updateBlock(
		block_id: string,
		block: Partial<BlockResponse>,
	): Promise<BlockResponse> {
		const response = await fetch(`${this.baseUrl}/blocks/${block_id}`, {
			method: "PATCH",
			headers: this.headers,
			body: JSON.stringify(block),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	// Page operations
	async retrievePage(page_id: string): Promise<PageResponse> {
		const response = await fetch(`${this.baseUrl}/pages/${page_id}`, {
			method: "GET",
			headers: this.headers,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async updatePageProperties(
		page_id: string,
		properties: Record<string, unknown>,
	): Promise<PageResponse> {
		const body = { properties };

		const response = await fetch(`${this.baseUrl}/pages/${page_id}`, {
			method: "PATCH",
			headers: this.headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	// User operations
	async listAllUsers(
		start_cursor?: string,
		page_size?: number,
	): Promise<ListResponse> {
		const params = new URLSearchParams();
		if (start_cursor) params.append("start_cursor", start_cursor);
		if (page_size) params.append("page_size", page_size.toString());

		const response = await fetch(`${this.baseUrl}/users?${params.toString()}`, {
			method: "GET",
			headers: this.headers,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async retrieveUser(user_id: string): Promise<UserResponse> {
		const response = await fetch(`${this.baseUrl}/users/${user_id}`, {
			method: "GET",
			headers: this.headers,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async retrieveBotUser(): Promise<UserResponse> {
		const response = await fetch(`${this.baseUrl}/users/me`, {
			method: "GET",
			headers: this.headers,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	// Database operations
	async createDatabase(
		parent: { page_id: string } | { workspace: boolean },
		properties: Record<string, unknown>,
		title?: RichTextItemResponse[],
	): Promise<DatabaseResponse> {
		const body = {
			parent,
			properties,
			...(title && { title }),
		};

		const response = await fetch(`${this.baseUrl}/databases`, {
			method: "POST",
			headers: this.headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async queryDatabase(
		database_id: string,
		filter?: Record<string, unknown>,
		sorts?: Array<{
			property?: string;
			timestamp?: string;
			direction: "ascending" | "descending";
		}>,
		start_cursor?: string,
		page_size?: number,
	): Promise<ListResponse> {
		const body: Record<string, unknown> = {};
		if (filter) body.filter = filter;
		if (sorts) body.sorts = sorts;
		if (start_cursor) body.start_cursor = start_cursor;
		if (page_size) body.page_size = page_size;

		const response = await fetch(
			`${this.baseUrl}/databases/${database_id}/query`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async retrieveDatabase(database_id: string): Promise<DatabaseResponse> {
		const response = await fetch(`${this.baseUrl}/databases/${database_id}`, {
			method: "GET",
			headers: this.headers,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async updateDatabase(
		database_id: string,
		title?: RichTextItemResponse[],
		description?: RichTextItemResponse[],
		properties?: Record<string, unknown>,
	): Promise<DatabaseResponse> {
		const body: Record<string, unknown> = {};
		if (title) body.title = title;
		if (description) body.description = description;
		if (properties) body.properties = properties;

		const response = await fetch(`${this.baseUrl}/databases/${database_id}`, {
			method: "PATCH",
			headers: this.headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async createDatabaseItem(
		database_id: string,
		properties: Record<string, unknown>,
	): Promise<PageResponse> {
		const body = {
			parent: { database_id },
			properties,
		};

		const response = await fetch(`${this.baseUrl}/pages`, {
			method: "POST",
			headers: this.headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	// Comment operations
	async createComment(
		parent?: { page_id: string },
		discussion_id?: string,
		rich_text?: RichTextItemResponse[],
	): Promise<CommentResponse> {
		const body: Record<string, unknown> = { rich_text };
		if (parent) {
			body.parent = parent;
		}
		if (discussion_id) {
			body.discussion_id = discussion_id;
		}

		const response = await fetch(`${this.baseUrl}/comments`, {
			method: "POST",
			headers: this.headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async retrieveComments(
		block_id: string,
		start_cursor?: string,
		page_size?: number,
	): Promise<ListResponse> {
		const params = new URLSearchParams();
		params.append("block_id", block_id);
		if (start_cursor) params.append("start_cursor", start_cursor);
		if (page_size) params.append("page_size", page_size.toString());

		const response = await fetch(
			`${this.baseUrl}/comments?${params.toString()}`,
			{
				method: "GET",
				headers: this.headers,
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	// Search operations
	async search(
		query?: string,
		filter?: { property: string; value: string },
		sort?: {
			direction: "ascending" | "descending";
			timestamp: "last_edited_time";
		},
		start_cursor?: string,
		page_size?: number,
	): Promise<ListResponse> {
		const body: Record<string, unknown> = {};
		if (query) body.query = query;
		if (filter) body.filter = filter;
		if (sort) body.sort = sort;
		if (start_cursor) body.start_cursor = start_cursor;
		if (page_size) body.page_size = page_size;

		const response = await fetch(`${this.baseUrl}/search`, {
			method: "POST",
			headers: this.headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	// Utility method for markdown conversion
	async toMarkdown(response: NotionResponse | ListResponse): Promise<string> {
		// Simple markdown conversion - can be enhanced later
		return JSON.stringify(response, null, 2);
	}
}
