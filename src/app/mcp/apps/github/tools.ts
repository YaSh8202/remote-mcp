import { Octokit } from "octokit";
import { z } from "zod";
import { type AnyMcpToolConfig, createParameterizedTool } from "../../mcp-app";

function parseGitHubUrl(url: string) {
	const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
	const match = url.match(regex);
	if (!match) {
		throw new Error("Invalid GitHub repository URL");
	}
	const [, owner, repo] = match;
	return { owner, repo: repo.replace(".git", "") };
}

const getRepoAllDirectoriesSchema = {
	repoUrl: z.string().url().describe("The URL of the Github repo"),
};

const getRepoAllDirectoriesTool = createParameterizedTool({
	name: "getRepoAllDirectories",
	description: "Fetch all directories in the root of a GitHub repository",
	paramsSchema: getRepoAllDirectoriesSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { owner, repo } = parseGitHubUrl(args.repoUrl);

			const { data } = await octokit.rest.repos.getContent({
				owner,
				repo,
				path: "",
			});

			// Format the response
			const items = Array.isArray(data)
				? data.map((item) => ({
						name: item.name,
						type: item.type,
						path: item.path,
					}))
				: [];

			const itemsDisplay = JSON.stringify(items, null, 2);

			return {
				content: [
					{
						type: "text" as const,
						text: `Repository root contents for ${owner}/${repo}:\n\n${itemsDisplay}`,
					},
				],
			};
		} catch (error) {
			console.error("Error fetching repo:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error fetching repo: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

const getRepoDirectoriesSchema = {
	repoUrl: z.string().url().describe("The URL of the Github repo"),
	path: z.string().describe("The directory path to fetch"),
};

const getRepoDirectoriesTool = createParameterizedTool({
	name: "getRepoDirectories",
	description: "Fetch directories in a specific path of a GitHub repository",
	paramsSchema: getRepoDirectoriesSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { owner, repo } = parseGitHubUrl(args.repoUrl);

			const { data } = await octokit.rest.repos.getContent({
				owner,
				repo,
				path: args.path,
			});

			// Format the response
			const items = Array.isArray(data)
				? data.map((item) => ({
						name: item.name,
						type: item.type,
						path: item.path,
					}))
				: [];

			const itemsDisplay = JSON.stringify(items, null, 2);

			return {
				content: [
					{
						type: "text" as const,
						text: `Contents for ${args.path} in ${owner}/${repo}:\n\n${itemsDisplay}`,
					},
				],
			};
		} catch (error) {
			console.error("Error fetching directory:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error fetching directory: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

const getRepoFileSchema = {
	repoUrl: z.string().url().describe("The URL of the Github repo"),
	path: z.string().describe("The file path to fetch"),
};

const getRepoFileTool = createParameterizedTool({
	name: "getRepoFile",
	description: "Fetch a file from a GitHub repository",
	paramsSchema: getRepoFileSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { owner, repo } = parseGitHubUrl(args.repoUrl);

			const { data } = await octokit.rest.repos.getContent({
				owner,
				repo,
				path: args.path,
			});

			// For files, data won't be an array
			if (Array.isArray(data) || data.type !== "file") {
				throw new Error("Requested path is not a file");
			}

			// Get content and decode if base64
			let content = "";
			if (data.encoding === "base64" && data.content) {
				content = Buffer.from(data.content, "base64").toString("utf-8");
			} else if (data.content) {
				content = data.content;
			}

			// Check for binary files
			const fileExtension = args.path.split(".").pop() || "txt";
			const isBinary =
				/^(jpg|jpeg|png|gif|bmp|ico|webp|mp3|mp4|wav|ogg|pdf|zip|tar|gz|rar|exe|dll|so|bin)$/i.test(
					fileExtension,
				);

			if (isBinary) {
				return {
					content: [
						{
							type: "text" as const,
							text: `File ${args.path} appears to be a binary file and cannot be displayed as text.`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `File content for ${args.path} in ${owner}/${repo}:\n\n${content}`,
					},
				],
			};
		} catch (error) {
			console.error("Error fetching file:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error fetching file: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

export const githubTools: AnyMcpToolConfig[] = [
	getRepoAllDirectoriesTool,
	getRepoDirectoriesTool,
	getRepoFileTool,
];
