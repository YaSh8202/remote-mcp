import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { Octokit } from "octokit";
import { z } from "zod";
import { formatError, githubAuth } from "../common";

// Get commit details
const getCommitSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	sha: z.string().describe("Commit SHA, branch name, or tag name"),
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

const getCommitTool = createParameterizedTool({
	name: "getCommit",
	auth: githubAuth,
	description: "Get details for a commit from a GitHub repository",
	paramsSchema: getCommitSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.repos.getCommit({
				owner: args.owner,
				repo: args.repo,
				ref: args.sha,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Commit details for ${args.sha} in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting commit:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting commit: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// List commits
const listCommitsSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	sha: z.string().optional().describe("SHA or Branch name"),
	author: z.string().optional().describe("Author username or email address"),
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

const listCommitsTool = createParameterizedTool({
	name: "listCommits",
	auth: githubAuth,
	description: "Get list of commits of a branch in a GitHub repository",
	paramsSchema: listCommitsSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.repos.listCommits({
				owner: args.owner,
				repo: args.repo,
				sha: args.sha,
				author: args.author,
				page: args.page,
				per_page: args.perPage,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Commits for ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error listing commits:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error listing commits: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// List branches
const listBranchesSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
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

const listBranchesTool = createParameterizedTool({
	name: "listBranches",
	auth: githubAuth,
	description: "List branches in a GitHub repository",
	paramsSchema: listBranchesSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.repos.listBranches({
				owner: args.owner,
				repo: args.repo,
				page: args.page,
				per_page: args.perPage,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Branches for ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error listing branches:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error listing branches: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Create or update file
const createOrUpdateFileSchema = {
	owner: z.string().describe("Repository owner (username or organization)"),
	repo: z.string().describe("Repository name"),
	path: z.string().describe("Path where to create/update the file"),
	content: z.string().describe("Content of the file"),
	message: z.string().describe("Commit message"),
	branch: z.string().describe("Branch to create/update the file in"),
	sha: z
		.string()
		.optional()
		.describe("SHA of file being replaced (for updates)"),
};

const createOrUpdateFileTool = createParameterizedTool({
	name: "createOrUpdateFile",
	auth: githubAuth,
	description:
		"Create or update a single file in a GitHub repository. If updating, you must provide the SHA of the file you want to update.",
	paramsSchema: createOrUpdateFileSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const params = {
				owner: args.owner,
				repo: args.repo,
				path: args.path,
				message: args.message,
				content: Buffer.from(args.content).toString("base64"),
				branch: args.branch,
				...(args.sha && { sha: args.sha }),
			};

			const { data } =
				await octokit.rest.repos.createOrUpdateFileContents(params);

			return {
				content: [
					{
						type: "text" as const,
						text: `File ${args.path} ${args.sha ? "updated" : "created"} in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error creating/updating file:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating/updating file: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Create repository
const createRepositorySchema = {
	name: z.string().describe("Repository name"),
	description: z.string().optional().describe("Repository description"),
	private: z.boolean().optional().describe("Whether repo should be private"),
	autoInit: z.boolean().optional().describe("Initialize with README"),
};

const createRepositoryTool = createParameterizedTool({
	name: "createRepository",
	auth: githubAuth,
	description: "Create a new GitHub repository in your account",
	paramsSchema: createRepositorySchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.repos.createForAuthenticatedUser({
				name: args.name,
				description: args.description,
				private: args.private,
				auto_init: args.autoInit,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Repository ${args.name} created successfully:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error creating repository:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating repository: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get file contents
const getFileContentsSchema = {
	owner: z.string().describe("Repository owner (username or organization)"),
	repo: z.string().describe("Repository name"),
	path: z
		.string()
		.describe("Path to file/directory (directories must end with a slash '/')"),
	branch: z.string().optional().describe("Branch to get contents from"),
};

const getFileContentsTool = createParameterizedTool({
	name: "getFileContents",
	auth: githubAuth,
	description:
		"Get the contents of a file or directory from a GitHub repository",
	paramsSchema: getFileContentsSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.repos.getContent({
				owner: args.owner,
				repo: args.repo,
				path: args.path,
				ref: args.branch,
			});

			// Handle file content
			if (!Array.isArray(data) && data.type === "file") {
				const content = Buffer.from(data.content, "base64").toString("utf-8");
				return {
					content: [
						{
							type: "text" as const,
							text: `File content for ${args.path} in ${args.owner}/${args.repo}:\n\n${content}`,
						},
					],
				};
			}

			// Handle directory or multiple files
			return {
				content: [
					{
						type: "text" as const,
						text: `Contents for ${args.path} in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting file contents:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting file contents: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Fork repository
const forkRepositorySchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	organization: z.string().optional().describe("Organization to fork to"),
};

const forkRepositoryTool = createParameterizedTool({
	name: "forkRepository",
	auth: githubAuth,
	description:
		"Fork a GitHub repository to your account or specified organization",
	paramsSchema: forkRepositorySchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.repos.createFork({
				owner: args.owner,
				repo: args.repo,
				organization: args.organization,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Repository ${args.owner}/${args.repo} forked successfully:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error forking repository:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error forking repository: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Delete file
const deleteFileSchema = {
	owner: z.string().describe("Repository owner (username or organization)"),
	repo: z.string().describe("Repository name"),
	path: z.string().describe("Path to the file to delete"),
	message: z.string().describe("Commit message"),
	branch: z.string().describe("Branch to delete the file from"),
};

const deleteFileTool = createParameterizedTool({
	name: "deleteFile",
	auth: githubAuth,
	description: "Delete a file from a GitHub repository",
	paramsSchema: deleteFileSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			// First, get the file to get its SHA
			const { data: fileData } = await octokit.rest.repos.getContent({
				owner: args.owner,
				repo: args.repo,
				path: args.path,
				ref: args.branch,
			});

			if (Array.isArray(fileData) || fileData.type !== "file") {
				throw new Error("Path does not point to a file");
			}

			const { data } = await octokit.rest.repos.deleteFile({
				owner: args.owner,
				repo: args.repo,
				path: args.path,
				message: args.message,
				sha: fileData.sha,
				branch: args.branch,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `File ${args.path} deleted from ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error deleting file:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error deleting file: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Create branch
const createBranchSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	branch: z.string().describe("Name for new branch"),
	from_branch: z
		.string()
		.optional()
		.describe("Source branch (defaults to repo default)"),
};

const createBranchTool = createParameterizedTool({
	name: "createBranch",
	auth: githubAuth,
	description: "Create a new branch in a GitHub repository",
	paramsSchema: createBranchSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			// Get the source branch SHA
			let fromBranch = args.from_branch;
			if (!fromBranch) {
				// Get default branch if from_branch not specified
				const { data: repoData } = await octokit.rest.repos.get({
					owner: args.owner,
					repo: args.repo,
				});
				fromBranch = repoData.default_branch;
			}

			// Get SHA of source branch
			const { data: refData } = await octokit.rest.git.getRef({
				owner: args.owner,
				repo: args.repo,
				ref: `heads/${fromBranch}`,
			});

			// Create new branch
			const { data } = await octokit.rest.git.createRef({
				owner: args.owner,
				repo: args.repo,
				ref: `refs/heads/${args.branch}`,
				sha: refData.object.sha,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Branch ${args.branch} created from ${fromBranch} in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error creating branch:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating branch: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Push files
const pushFilesSchema = {
	owner: z.string().describe("Repository owner"),
	repo: z.string().describe("Repository name"),
	branch: z.string().describe("Branch to push to"),
	files: z
		.array(
			z.object({
				path: z.string().describe("path to the file"),
				content: z.string().describe("file content"),
			}),
		)
		.describe(
			"Array of file objects to push, each object with path (string) and content (string)",
		),
	message: z.string().describe("Commit message"),
};

const pushFilesTool = createParameterizedTool({
	name: "pushFiles",
	auth: githubAuth,
	description: "Push multiple files to a GitHub repository in a single commit",
	paramsSchema: pushFilesSchema,
	callback: async (args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			// Get the reference for the branch
			const { data: refData } = await octokit.rest.git.getRef({
				owner: args.owner,
				repo: args.repo,
				ref: `heads/${args.branch}`,
			});

			// Get the commit object that the branch points to
			const { data: commitData } = await octokit.rest.git.getCommit({
				owner: args.owner,
				repo: args.repo,
				commit_sha: refData.object.sha,
			});

			// Create tree entries for all files
			const tree = args.files.map((file) => ({
				path: file.path,
				mode: "100644" as const,
				type: "blob" as const,
				content: file.content,
			}));

			// Create a new tree with the file entries
			const { data: treeData } = await octokit.rest.git.createTree({
				owner: args.owner,
				repo: args.repo,
				base_tree: commitData.tree.sha,
				tree,
			});

			// Create a new commit
			const { data: newCommitData } = await octokit.rest.git.createCommit({
				owner: args.owner,
				repo: args.repo,
				message: args.message,
				tree: treeData.sha,
				parents: [refData.object.sha],
			});

			// Update the reference to point to the new commit
			const { data } = await octokit.rest.git.updateRef({
				owner: args.owner,
				repo: args.repo,
				ref: `heads/${args.branch}`,
				sha: newCommitData.sha,
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Files pushed to ${args.branch} in ${args.owner}/${args.repo}:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error pushing files:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error pushing files: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

export {
	getCommitTool,
	listCommitsTool,
	listBranchesTool,
	createOrUpdateFileTool,
	createRepositoryTool,
	getFileContentsTool,
	forkRepositoryTool,
	deleteFileTool,
	createBranchTool,
	pushFilesTool,
};
