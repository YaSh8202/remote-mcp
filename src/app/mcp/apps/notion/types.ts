// Notion API response types based on the mcp-notion-server repository

export interface NotionResponse {
	object: string;
	id: string;
	created_time: string;
	last_edited_time: string;
}

export interface RichTextItemResponse {
	type: string;
	text?: {
		content: string;
		link?: { url: string } | null;
	};
	mention?: {
		type: string;
		[key: string]: unknown;
	};
	equation?: {
		expression: string;
	};
	annotations?: {
		bold?: boolean;
		italic?: boolean;
		strikethrough?: boolean;
		underline?: boolean;
		code?: boolean;
		color?: string;
	};
	plain_text: string;
	href?: string | null;
}

export interface BlockResponse extends NotionResponse {
	type: string;
	archived: boolean;
	in_trash: boolean;
	has_children: boolean;
	parent: {
		type: string;
		[key: string]: unknown;
	};
	[key: string]: unknown; // Dynamic block content based on type
}

export interface PageResponse extends NotionResponse {
	parent: {
		type: string;
		[key: string]: unknown;
	};
	properties: Record<string, unknown>;
	url: string;
	public_url?: string | null;
}

export interface DatabaseResponse extends NotionResponse {
	title: RichTextItemResponse[];
	description: RichTextItemResponse[];
	properties: Record<string, unknown>;
	parent: {
		type: string;
		[key: string]: unknown;
	};
	url: string;
	archived: boolean;
	is_inline: boolean;
	public_url?: string | null;
}

export interface UserResponse extends NotionResponse {
	type: string;
	name?: string;
	avatar_url?: string | null;
	person?: {
		email: string;
	};
	bot?: {
		owner: {
			type: string;
			[key: string]: unknown;
		};
		workspace_name?: string;
	};
}

export interface CommentResponse extends NotionResponse {
	parent: {
		type: string;
		[key: string]: unknown;
	};
	discussion_id: string;
	rich_text: RichTextItemResponse[];
}

export interface ListResponse {
	object: "list";
	results: NotionResponse[];
	next_cursor?: string | null;
	has_more: boolean;
	type?: string;
	page_or_database?: unknown;
	developer_survey?: string;
	request_id: string;
}
