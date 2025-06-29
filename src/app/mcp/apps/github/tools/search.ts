import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { Octokit } from "octokit";
import { z } from "zod";
import { formatError, githubAuth } from "../common";

// Search repositories
const searchRepositoriesSchema = {
	query: z.string().describe("Search query"),
	page: z.number().optional().describe("Page number for pagination (min 1)"),
	perPage: z
		.number()
		.optional()
		.describe("Results per page for pagination (min 1, max 100)"),
};

const searchRepositoriesTool = createParameterizedTool({
	name: "search_repositories",
	auth: githubAuth,
	description: "Search for GitHub repositories",
	paramsSchema: searchRepositoriesSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.search.repos({
				q: args.query,
				page: args.page || 1,
				per_page: Math.min(args.perPage || 30, 100),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Search results for repositories matching "${args.query}":\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error searching repositories:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching repositories: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Search code
const searchCodeSchema = {
	q: z.string().describe("Search query using GitHub code search syntax"),
	sort: z.string().optional().describe("Sort field ('indexed' only)"),
	order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
	page: z.number().optional().describe("Page number for pagination (min 1)"),
	perPage: z
		.number()
		.optional()
		.describe("Results per page for pagination (min 1, max 100)"),
};

const searchCodeTool = createParameterizedTool({
	name: "search_code",
	auth: githubAuth,
	description: "Search for code across GitHub repositories",
	paramsSchema: searchCodeSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.search.code({
				q: args.q,
				sort: args.sort as "indexed" | undefined,
				order: args.order,
				page: args.page || 1,
				per_page: Math.min(args.perPage || 30, 100),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Search results for code matching "${args.q}":\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error searching code:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching code: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Search users
const searchUsersSchema = {
	q: z.string().describe("Search query using GitHub users search syntax"),
	sort: z
		.enum(["followers", "repositories", "joined"])
		.optional()
		.describe("Sort field by category"),
	order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
	page: z.number().optional().describe("Page number for pagination (min 1)"),
	perPage: z
		.number()
		.optional()
		.describe("Results per page for pagination (min 1, max 100)"),
};

const searchUsersTool = createParameterizedTool({
	name: "search_users",
	auth: githubAuth,
	description: "Search for GitHub users",
	paramsSchema: searchUsersSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.search.users({
				q: args.q,
				sort: args.sort,
				order: args.order,
				page: args.page || 1,
				per_page: Math.min(args.perPage || 30, 100),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Search results for users matching "${args.q}":\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error searching users:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching users: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

export { searchRepositoriesTool, searchCodeTool, searchUsersTool };
