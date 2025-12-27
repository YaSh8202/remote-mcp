import { Octokit } from "octokit";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { formatError, githubAuth } from "../common";

// Get issue details
const getIssueSchema = {
	owner: z.string().describe("The owner of the repository"),
	repo: z.string().describe("The name of the repository"),
	issue_number: z.number().describe("The number of the issue"),
};

const getIssueTool = createParameterizedTool({
	name: "getIssue",
	auth: githubAuth,
	description: "Get details of a specific issue in a GitHub repository.",
	paramsSchema: getIssueSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.issues.get({
				owner: args.owner,
				repo: args.repo,
				issue_number: args.issue_number,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Issue details for #${args.issue_number} in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting issue:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting issue: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Add issue comment
const addIssueCommentSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	issue_number: z.number().describe("Issue number to comment on"),
	body: z.string().describe("Comment content"),
};

const addIssueCommentTool = createParameterizedTool({
	name: "addIssueComment",
	auth: githubAuth,
	description: "Add a comment to a specific issue in a GitHub repository.",
	paramsSchema: addIssueCommentSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.issues.createComment({
				owner: args.owner,
				repo: args.repo,
				issue_number: args.issue_number,
				body: args.body,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Comment added to issue #${args.issue_number}:\n\n${JSON.stringify(data, null, 2)}`,
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

// Search issues
const searchIssuesSchema = {
	q: z.string().describe("Search query using GitHub issues search syntax"),
	sort: z
		.enum([
			"comments",
			"reactions",
			"reactions-+1",
			"reactions--1",
			"reactions-smile",
			"reactions-thinking_face",
			"reactions-heart",
			"reactions-tada",
			"interactions",
			"created",
			"updated",
		])
		.optional()
		.describe(
			"Sort field by number of matches of categories, defaults to best match",
		),
	order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
	page: z.number().optional().describe("Page number for pagination (min 1)"),
	perPage: z
		.number()
		.optional()
		.describe("Results per page for pagination (min 1, max 100)"),
};

const searchIssuesTool = createParameterizedTool({
	name: "searchIssues",
	auth: githubAuth,
	description: "Search for issues in GitHub repositories.",
	paramsSchema: searchIssuesSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.search.issuesAndPullRequests({
				q: `${args.q} is:issue`,
				sort: args.sort,
				order: args.order,
				page: args.page,
				per_page: args.perPage,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Search results for "${args.q}":\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error searching issues:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching issues: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Create issue
const createIssueSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	title: z.string().describe("Issue title"),
	body: z.string().optional().describe("Issue body content"),
	assignees: z
		.array(z.string())
		.optional()
		.describe("Usernames to assign to this issue"),
	labels: z
		.array(z.string())
		.optional()
		.describe("Labels to apply to this issue"),
	milestone: z.number().optional().describe("Milestone number"),
};

const createIssueTool = createParameterizedTool({
	name: "createIssue",
	auth: githubAuth,
	description: "Create a new issue in a GitHub repository.",
	paramsSchema: createIssueSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.issues.create({
				owner: args.owner,
				repo: args.repo,
				title: args.title,
				body: args.body,
				assignees: args.assignees,
				labels: args.labels,
				milestone: args.milestone,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Issue created in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error creating issue:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating issue: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// List issues
const listIssuesSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	state: z
		.enum(["open", "closed", "all"])
		.optional()
		.describe("Filter by state"),
	labels: z.array(z.string()).optional().describe("Filter by labels"),
	sort: z
		.enum(["created", "updated", "comments"])
		.optional()
		.describe("Sort order"),
	direction: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
	since: z.string().optional().describe("Filter by date (ISO 8601 timestamp)"),
	page: z.number().optional().describe("Page number for pagination (min 1)"),
	perPage: z
		.number()
		.optional()
		.describe("Results per page for pagination (min 1, max 100)"),
};

const listIssuesTool = createParameterizedTool({
	name: "listIssues",
	auth: githubAuth,
	description: "List issues in a GitHub repository.",
	paramsSchema: listIssuesSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.issues.listForRepo({
				owner: args.owner,
				repo: args.repo,
				state: args.state,
				labels: args.labels?.join(","),
				sort: args.sort,
				direction: args.direction,
				since: args.since,
				page: args.page,
				per_page: args.perPage,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Issues in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error listing issues:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error listing issues: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Update issue
const updateIssueSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	issue_number: z.number().describe("Issue number to update"),
	title: z.string().optional().describe("New title"),
	body: z.string().optional().describe("New description"),
	state: z.enum(["open", "closed"]).optional().describe("New state"),
	labels: z.array(z.string()).optional().describe("New labels"),
	assignees: z.array(z.string()).optional().describe("New assignees"),
	milestone: z.number().optional().describe("New milestone number"),
};

const updateIssueTool = createParameterizedTool({
	name: "updateIssue",
	auth: githubAuth,
	description: "Update an existing issue in a GitHub repository.",
	paramsSchema: updateIssueSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.issues.update({
				owner: args.owner,
				repo: args.repo,
				issue_number: args.issue_number,
				title: args.title,
				body: args.body,
				state: args.state,
				labels: args.labels,
				assignees: args.assignees,
				milestone: args.milestone,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Issue #${args.issue_number} updated in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error updating issue:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error updating issue: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get issue comments
const getIssueCommentsSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	issue_number: z.number().describe("Issue number"),
	page: z.number().optional().describe("Page number"),
	per_page: z.number().optional().describe("Number of records per page"),
};

const getIssueCommentsTool = createParameterizedTool({
	name: "getIssueComments",
	auth: githubAuth,
	description: "Get comments for a specific issue in a GitHub repository.",
	paramsSchema: getIssueCommentsSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.issues.listComments({
				owner: args.owner,
				repo: args.repo,
				issue_number: args.issue_number,
				page: args.page,
				per_page: args.per_page,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Comments for issue #${args.issue_number} in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting issue comments:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting issue comments: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

export {
	getIssueTool,
	addIssueCommentTool,
	searchIssuesTool,
	createIssueTool,
	listIssuesTool,
	updateIssueTool,
	getIssueCommentsTool,
};
