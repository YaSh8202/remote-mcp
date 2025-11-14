import { Octokit } from "octokit";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { formatError, githubAuth } from "../common";

// Get details of a specific pull request
const getPullRequestSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	pullNumber: z.number().describe("Pull request number"),
};

export const getPullRequestTool = createParameterizedTool({
	name: "getPullRequest",
	auth: githubAuth,
	description: "Get details of a specific pull request in a GitHub repository.",
	paramsSchema: getPullRequestSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.pulls.get({
				owner: args.owner,
				repo: args.repo,
				pull_number: args.pullNumber,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error getting pull request: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Create a new pull request
const createPullRequestSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	title: z.string().describe("PR title"),
	body: z.string().optional().describe("PR description"),
	head: z.string().describe("Branch containing changes"),
	base: z.string().describe("Branch to merge into"),
	draft: z.boolean().optional().describe("Create as draft PR"),
	maintainer_can_modify: z
		.boolean()
		.optional()
		.describe("Allow maintainer edits"),
};

export const createPullRequestTool = createParameterizedTool({
	name: "createPullRequest",
	auth: githubAuth,
	description: "Create a new pull request in a GitHub repository.",
	paramsSchema: createPullRequestSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.pulls.create({
				owner: args.owner,
				repo: args.repo,
				title: args.title,
				body: args.body,
				head: args.head,
				base: args.base,
				draft: args.draft,
				maintainer_can_modify: args.maintainer_can_modify,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error creating pull request: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Update an existing pull request
const updatePullRequestSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	pullNumber: z.number().describe("Pull request number to update"),
	title: z.string().optional().describe("New title"),
	body: z.string().optional().describe("New description"),
	state: z.enum(["open", "closed"]).optional().describe("New state"),
	base: z.string().optional().describe("New base branch name"),
	maintainer_can_modify: z
		.boolean()
		.optional()
		.describe("Allow maintainer edits"),
};

export const updatePullRequestTool = createParameterizedTool({
	name: "updatePullRequest",
	auth: githubAuth,
	description: "Update an existing pull request in a GitHub repository.",
	paramsSchema: updatePullRequestSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const updateData: Record<string, string | boolean> = {};
			if (args.title !== undefined) updateData.title = args.title;
			if (args.body !== undefined) updateData.body = args.body;
			if (args.state !== undefined) updateData.state = args.state;
			if (args.base !== undefined) updateData.base = args.base;
			if (args.maintainer_can_modify !== undefined)
				updateData.maintainer_can_modify = args.maintainer_can_modify;

			if (Object.keys(updateData).length === 0) {
				throw new Error("No update parameters provided");
			}

			const { data } = await octokit.rest.pulls.update({
				owner: args.owner,
				repo: args.repo,
				pull_number: args.pullNumber,
				...updateData,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error updating pull request: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// List pull requests in a repository
const listPullRequestsSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	state: z
		.enum(["open", "closed", "all"])
		.optional()
		.describe("Filter by state"),
	head: z.string().optional().describe("Filter by head user/org and branch"),
	base: z.string().optional().describe("Filter by base branch"),
	sort: z
		.enum(["created", "updated", "popularity", "long-running"])
		.optional()
		.describe("Sort by"),
	direction: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
	page: z
		.number()
		.min(1)
		.optional()
		.describe("Page number for pagination (min 1)"),
	perPage: z
		.number()
		.min(1)
		.max(100)
		.optional()
		.describe("Results per page for pagination (min 1, max 100)"),
};

export const listPullRequestsTool = createParameterizedTool({
	name: "listPullRequests",
	auth: githubAuth,
	description: "List pull requests in a GitHub repository.",
	paramsSchema: listPullRequestsSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.pulls.list({
				owner: args.owner,
				repo: args.repo,
				state: args.state,
				head: args.head,
				base: args.base,
				sort: args.sort,
				direction: args.direction,
				page: args.page,
				per_page: args.perPage,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error listing pull requests: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Merge a pull request
const mergePullRequestSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	pullNumber: z.number().describe("Pull request number"),
	commit_title: z.string().optional().describe("Title for merge commit"),
	commit_message: z
		.string()
		.optional()
		.describe("Extra detail for merge commit"),
	merge_method: z
		.enum(["merge", "squash", "rebase"])
		.optional()
		.describe("Merge method"),
};

export const mergePullRequestTool = createParameterizedTool({
	name: "mergePullRequest",
	auth: githubAuth,
	description: "Merge a pull request in a GitHub repository.",
	paramsSchema: mergePullRequestSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const mergeData: Record<string, string> = {};
			if (args.commit_title) mergeData.commit_title = args.commit_title;
			if (args.commit_message) mergeData.commit_message = args.commit_message;
			if (args.merge_method) mergeData.merge_method = args.merge_method;

			const { data } = await octokit.rest.pulls.merge({
				owner: args.owner,
				repo: args.repo,
				pull_number: args.pullNumber,
				...mergeData,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error merging pull request: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get files changed in a pull request
const getPullRequestFilesSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	pullNumber: z.number().describe("Pull request number"),
	page: z
		.number()
		.min(1)
		.optional()
		.describe("Page number for pagination (min 1)"),
	perPage: z
		.number()
		.min(1)
		.max(100)
		.optional()
		.describe("Results per page for pagination (min 1, max 100)"),
};

export const getPullRequestFilesTool = createParameterizedTool({
	name: "getPullRequestFiles",
	auth: githubAuth,
	description: "Get the files changed in a specific pull request.",
	paramsSchema: getPullRequestFilesSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.pulls.listFiles({
				owner: args.owner,
				repo: args.repo,
				pull_number: args.pullNumber,
				page: args.page,
				per_page: args.perPage,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error getting pull request files: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get pull request diff
const getPullRequestDiffSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	pullNumber: z.number().describe("Pull request number"),
};

export const getPullRequestDiffTool = createParameterizedTool({
	name: "getPullRequestDiff",
	auth: githubAuth,
	description: "Get the diff of a pull request.",
	paramsSchema: getPullRequestDiffSchema,
	callback: async (args, extra) => {
		try {
			const token = extra?.auth?.access_token || process.env.GITHUB_TOKEN;
			if (!token) {
				throw new Error("No authentication token available");
			}

			const response = await fetch(
				`https://api.github.com/repos/${args.owner}/${args.repo}/pulls/${args.pullNumber}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/vnd.github.v3.diff",
					},
				},
			);

			if (!response.ok) {
				throw new Error(
					`Failed to get pull request diff: ${response.statusText}`,
				);
			}

			const diff = await response.text();

			return {
				content: [
					{
						type: "text",
						text: diff,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error getting pull request diff: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get pull request status
const getPullRequestStatusSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	pullNumber: z.number().describe("Pull request number"),
};

export const getPullRequestStatusTool = createParameterizedTool({
	name: "getPullRequestStatus",
	auth: githubAuth,
	description: "Get the status of a specific pull request.",
	paramsSchema: getPullRequestStatusSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			// First get the pull request to get the head SHA
			const { data: pullRequest } = await octokit.rest.pulls.get({
				owner: args.owner,
				repo: args.repo,
				pull_number: args.pullNumber,
			});

			const headSha = pullRequest.head.sha;

			// Get the combined status for the head SHA
			const { data } = await octokit.rest.repos.getCombinedStatusForRef({
				owner: args.owner,
				repo: args.repo,
				ref: headSha,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error getting pull request status: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Update pull request branch
const updatePullRequestBranchSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	pullNumber: z.number().describe("Pull request number"),
	expectedHeadSha: z
		.string()
		.optional()
		.describe("The expected SHA of the pull request's HEAD ref"),
};

export const updatePullRequestBranchTool = createParameterizedTool({
	name: "updatePullRequestBranch",
	auth: githubAuth,
	description:
		"Update the branch of a pull request with the latest changes from the base branch.",
	paramsSchema: updatePullRequestBranchSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const updateData: Record<string, string> = {};
			if (args.expectedHeadSha) {
				updateData.expected_head_sha = args.expectedHeadSha;
			}

			const { data } = await octokit.rest.pulls.updateBranch({
				owner: args.owner,
				repo: args.repo,
				pull_number: args.pullNumber,
				...updateData,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error updating pull request branch: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get pull request comments
const getPullRequestCommentsSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	pullNumber: z.number().describe("Pull request number"),
};

export const getPullRequestCommentsTool = createParameterizedTool({
	name: "getPullRequestComments",
	auth: githubAuth,
	description: "Get comments for a specific pull request.",
	paramsSchema: getPullRequestCommentsSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.pulls.listReviewComments({
				owner: args.owner,
				repo: args.repo,
				pull_number: args.pullNumber,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error getting pull request comments: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get pull request reviews
const getPullRequestReviewsSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	pullNumber: z.number().describe("Pull request number"),
};

export const getPullRequestReviewsTool = createParameterizedTool({
	name: "getPullRequestReviews",
	auth: githubAuth,
	description: "Get reviews for a specific pull request.",
	paramsSchema: getPullRequestReviewsSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.pulls.listReviews({
				owner: args.owner,
				repo: args.repo,
				pull_number: args.pullNumber,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error getting pull request reviews: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
