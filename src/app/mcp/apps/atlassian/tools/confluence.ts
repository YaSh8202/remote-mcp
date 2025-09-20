import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod/v4";
import { atlassianAuth, formatError } from "../common";

// Helper function to make authenticated Confluence API calls
async function makeConfluenceRequest(
	accessToken: string,
	cloudId: string,
	endpoint: string,
	options: RequestInit = {},
) {
	const baseUrl = `https://api.atlassian.com/ex/confluence/${cloudId}`;
	const url = `${baseUrl}${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/json",
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`HTTP ${response.status}: ${errorText}`);
	}

	return response.json();
}

// Search Confluence content
const searchConfluenceSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	query: z.string().describe("Search query - can be simple text or CQL query"),
	limit: z
		.number()
		.optional()
		.default(10)
		.describe("Maximum number of results"),
	start: z
		.number()
		.optional()
		.default(0)
		.describe("Starting index for pagination"),
	spaceKey: z.string().optional().describe("Limit search to specific space"),
};

const searchConfluenceTool = createParameterizedTool({
	name: "searchConfluence",
	auth: atlassianAuth,
	description: "Search Confluence content using text or CQL queries.",
	paramsSchema: searchConfluenceSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const params = new URLSearchParams({
				cql: args.query.includes("type=")
					? args.query
					: `siteSearch ~ "${args.query}"`,
				limit: args.limit.toString(),
				start: args.start.toString(),
			});

			if (args.spaceKey) {
				const cql = params.get("cql");
				params.set("cql", `${cql} AND space=${args.spaceKey}`);
			}

			const endpoint = `/rest/api/content/search?${params.toString()}`;
			const results = await makeConfluenceRequest(
				extra.auth.access_token,
				args.cloudId,
				endpoint,
			);

			return {
				content: [
					{
						type: "text" as const,
						text: `Confluence search results for "${args.query}":\n\n${JSON.stringify(results, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error searching Confluence:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching Confluence: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get Confluence page content
const getPageSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	pageId: z.string().describe("Confluence page ID"),
	expand: z
		.string()
		.optional()
		.default("body.storage,version")
		.describe("Comma-separated list of properties to expand"),
};

const getPageTool = createParameterizedTool({
	name: "getConfluencePage",
	auth: atlassianAuth,
	description: "Get content of a specific Confluence page.",
	paramsSchema: getPageSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const endpoint = `/rest/api/content/${args.pageId}?expand=${args.expand}`;
			const page = await makeConfluenceRequest(
				extra.auth.access_token,
				args.cloudId,
				endpoint,
			);

			return {
				content: [
					{
						type: "text" as const,
						text: `Confluence page ${args.pageId} content:\n\n${JSON.stringify(page, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting Confluence page:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting page: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Create Confluence page
const createPageSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	spaceKey: z.string().describe("Space key where to create the page"),
	title: z.string().describe("Page title"),
	content: z
		.string()
		.describe("Page content in Confluence storage format or plain text"),
	parentId: z.string().optional().describe("Parent page ID (for child pages)"),
};

const createPageTool = createParameterizedTool({
	name: "createConfluencePage",
	auth: atlassianAuth,
	description: "Create a new Confluence page.",
	paramsSchema: createPageSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const pageData = {
				type: "page",
				title: args.title,
				space: { key: args.spaceKey },
				body: {
					storage: {
						value: args.content.startsWith("<")
							? args.content
							: `<p>${args.content}</p>`,
						representation: "storage",
					},
				},
				...(args.parentId && {
					ancestors: [{ id: args.parentId }],
				}),
			};

			const endpoint = "/rest/api/content";
			const page = await makeConfluenceRequest(
				extra.auth.access_token,
				args.cloudId,
				endpoint,
				{
					method: "POST",
					body: JSON.stringify(pageData),
				},
			);

			return {
				content: [
					{
						type: "text" as const,
						text: `Created Confluence page successfully:\n\n${JSON.stringify(page, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error creating Confluence page:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating page: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Update Confluence page
const updatePageSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	pageId: z.string().describe("Page ID to update"),
	title: z.string().optional().describe("Updated page title"),
	content: z
		.string()
		.optional()
		.describe("Updated page content in Confluence storage format"),
	version: z
		.number()
		.describe("Current version number of the page (required for updates)"),
};

const updatePageTool = createParameterizedTool({
	name: "updateConfluencePage",
	auth: atlassianAuth,
	description: "Update an existing Confluence page.",
	paramsSchema: updatePageSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			// First get current page data to preserve what's not being updated
			const currentPage = await makeConfluenceRequest(
				extra.auth.access_token,
				args.cloudId,
				`/rest/api/content/${args.pageId}?expand=body.storage,space`,
			);

			const updateData = {
				version: { number: args.version + 1 },
				title: args.title || currentPage.title,
				type: "page",
				...(args.content && {
					body: {
						storage: {
							value: args.content.startsWith("<")
								? args.content
								: `<p>${args.content}</p>`,
							representation: "storage",
						},
					},
				}),
			};

			const endpoint = `/rest/api/content/${args.pageId}`;
			const updatedPage = await makeConfluenceRequest(
				extra.auth.access_token,
				args.cloudId,
				endpoint,
				{
					method: "PUT",
					body: JSON.stringify(updateData),
				},
			);

			return {
				content: [
					{
						type: "text" as const,
						text: `Updated Confluence page ${args.pageId} successfully:\n\n${JSON.stringify(updatedPage, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error updating Confluence page:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error updating page: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get page children
const getPageChildrenSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	pageId: z.string().describe("Parent page ID"),
	limit: z
		.number()
		.optional()
		.default(25)
		.describe("Maximum number of children to retrieve"),
	start: z
		.number()
		.optional()
		.default(0)
		.describe("Starting index for pagination"),
};

const getPageChildrenTool = createParameterizedTool({
	name: "getConfluencePageChildren",
	auth: atlassianAuth,
	description: "Get child pages of a Confluence page.",
	paramsSchema: getPageChildrenSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const params = new URLSearchParams({
				limit: args.limit.toString(),
				start: args.start.toString(),
			});

			const endpoint = `/rest/api/content/${args.pageId}/child/page?${params.toString()}`;
			const children = await makeConfluenceRequest(
				extra.auth.access_token,
				args.cloudId,
				endpoint,
			);

			return {
				content: [
					{
						type: "text" as const,
						text: `Child pages of ${args.pageId}:\n\n${JSON.stringify(children, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting page children:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting page children: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get page comments
const getCommentsSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	pageId: z.string().describe("Page ID to get comments for"),
	limit: z
		.number()
		.optional()
		.default(25)
		.describe("Maximum number of comments to retrieve"),
	start: z
		.number()
		.optional()
		.default(0)
		.describe("Starting index for pagination"),
};

const getCommentsTool = createParameterizedTool({
	name: "getConfluenceComments",
	auth: atlassianAuth,
	description: "Get comments for a Confluence page.",
	paramsSchema: getCommentsSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const params = new URLSearchParams({
				limit: args.limit.toString(),
				start: args.start.toString(),
				expand: "body.storage,version,author",
			});

			const endpoint = `/rest/api/content/${args.pageId}/child/comment?${params.toString()}`;
			const comments = await makeConfluenceRequest(
				extra.auth.access_token,
				args.cloudId,
				endpoint,
			);

			return {
				content: [
					{
						type: "text" as const,
						text: `Comments for page ${args.pageId}:\n\n${JSON.stringify(comments, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting page comments:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting comments: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Add comment to page
const addPageCommentSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	pageId: z.string().describe("Page ID to add comment to"),
	comment: z.string().describe("Comment text"),
};

const addPageCommentTool = createParameterizedTool({
	name: "addConfluenceComment",
	auth: atlassianAuth,
	description: "Add a comment to a Confluence page.",
	paramsSchema: addPageCommentSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const commentData = {
				type: "comment",
				container: { id: args.pageId },
				body: {
					storage: {
						value: args.comment.startsWith("<")
							? args.comment
							: `<p>${args.comment}</p>`,
						representation: "storage",
					},
				},
			};

			const endpoint = "/rest/api/content";
			const comment = await makeConfluenceRequest(
				extra.auth.access_token,
				args.cloudId,
				endpoint,
				{
					method: "POST",
					body: JSON.stringify(commentData),
				},
			);

			return {
				content: [
					{
						type: "text" as const,
						text: `Added comment to page ${args.pageId}:\n\n${JSON.stringify(comment, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error adding comment:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error adding comment: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

export {
	searchConfluenceTool,
	getPageTool,
	createPageTool,
	updatePageTool,
	getPageChildrenTool,
	getCommentsTool,
	addPageCommentTool,
};
