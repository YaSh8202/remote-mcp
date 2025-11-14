import { Gitlab } from "@gitbeaker/rest";
import { z } from "zod";
import { createParameterizedTool } from "../../mcp-app/tools";
import { gitlabAuth } from ".";

// Helper function to format errors for MCP responses
const formatErrorResponse = (error: Error) => ({
	content: [
		{
			type: "text" as const,
			text: `Error: ${error.message}${error.cause ? ` - ${error.cause}` : ""}`,
		},
	],
	isError: true,
});

const getProjectsSchema = {
	verbose: z
		.boolean()
		.default(false)
		.describe(
			"By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.",
		),
};

const getProjectsTool = createParameterizedTool({
	name: "getProjects",
	auth: gitlabAuth,
	description:
		"Get a list of Gitlab projects with id, name, description, web_url and other useful information.",
	paramsSchema: getProjectsSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}

			const api = new Gitlab({
				oauthToken: extra?.auth?.access_token,
			});

			const projectFilter = {
				...(process.env.MR_MCP_MIN_ACCESS_LEVEL
					? {
							minAccessLevel: Number.parseInt(
								process.env.MR_MCP_MIN_ACCESS_LEVEL,
								10,
							),
						}
					: {}),
				...(process.env.MR_MCP_PROJECT_SEARCH_TERM
					? { search: process.env.MR_MCP_PROJECT_SEARCH_TERM }
					: {}),
			};

			const projects = await api.Projects.all({
				membership: true,
				...projectFilter,
			});

			const filteredProjects = args.verbose
				? projects
				: projects.map((project: Record<string, unknown>) => ({
						id: project.id,
						description: project.description,
						name: project.name,
						path: project.path,
						path_with_namespace: project.path_with_namespace,
						web_url: project.web_url,
						default_branch: project.default_branch,
					}));

			const projectsText =
				Array.isArray(filteredProjects) && filteredProjects.length > 0
					? JSON.stringify(filteredProjects, null, 2)
					: "No projects found.";

			return {
				content: [{ type: "text" as const, text: projectsText }],
			};
		} catch (error) {
			console.error("Error fetching projects:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

const listOpenMergeRequestsSchema = {
	project_id: z.number().describe("The project ID of the merge request"),
	verbose: z
		.boolean()
		.default(false)
		.describe(
			"By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.",
		),
};

const listOpenMergeRequestsTool = createParameterizedTool({
	name: "listOpenMergeRequests",
	auth: gitlabAuth,
	description: "Lists all open merge requests in the project",
	paramsSchema: listOpenMergeRequestsSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}
			const api = new Gitlab({
				oauthToken: extra.auth.access_token,
			});

			const mergeRequests = await api.MergeRequests.all({
				projectId: args.project_id,
				state: "opened",
			});

			const filteredMergeRequests = args.verbose
				? mergeRequests
				: mergeRequests.map((mr: Record<string, unknown>) => ({
						iid: mr.iid,
						project_id: mr.project_id,
						title: mr.title,
						description: mr.description,
						state: mr.state,
						web_url: mr.web_url,
					}));

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(filteredMergeRequests, null, 2),
					},
				],
			};
		} catch (error) {
			console.error("Error fetching merge requests:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

const getMergeRequestDetailsSchema = {
	project_id: z.number().describe("The project ID of the merge request"),
	merge_request_iid: z
		.number()
		.describe("The internal ID of the merge request within the project"),
	verbose: z
		.boolean()
		.default(false)
		.describe(
			"By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.",
		),
};

const getMergeRequestDetailsTool = createParameterizedTool({
	name: "getMergeRequestDetails",
	auth: gitlabAuth,
	description:
		"Get details about a specific merge request of a project like title, source-branch, target-branch, web_url, ...",
	paramsSchema: getMergeRequestDetailsSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}
			const api = new Gitlab({
				oauthToken: extra?.auth?.access_token,
			});

			const mr = await api.MergeRequests.show(
				args.project_id,
				args.merge_request_iid,
			);

			const filteredMr = args.verbose
				? mr
				: {
						title: mr.title,
						description: mr.description,
						state: mr.state,
						web_url: mr.web_url,
						target_branch: mr.target_branch,
						source_branch: mr.source_branch,
						merge_status: mr.merge_status,
						detailed_merge_status: mr.detailed_merge_status,
						diff_refs: mr.diff_refs,
					};

			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(filteredMr, null, 2) },
				],
			};
		} catch (error) {
			console.error("Error fetching merge request details:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

const getMergeRequestCommentsSchema = {
	project_id: z.number().describe("The project ID of the merge request"),
	merge_request_iid: z
		.number()
		.describe("The internal ID of the merge request within the project"),
	verbose: z
		.boolean()
		.default(false)
		.describe(
			"By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.",
		),
};

const getMergeRequestCommentsTool = createParameterizedTool({
	name: "getMergeRequestComments",
	auth: gitlabAuth,
	description: "Get general and file diff comments of a certain merge request",
	paramsSchema: getMergeRequestCommentsSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}
			const api = new Gitlab({
				oauthToken: extra?.auth?.access_token,
			});

			const discussions = await api.MergeRequestDiscussions.all(
				args.project_id,
				args.merge_request_iid,
			);

			if (args.verbose) {
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(discussions, null, 2),
						},
					],
				};
			}

			const unresolvedNotes = discussions
				.flatMap((note: Record<string, unknown>) => note.notes as unknown[])
				.filter(
					(note: unknown) =>
						(note as Record<string, unknown>).resolved === false,
				);

			const discussionNotes = unresolvedNotes
				.filter(
					(note: unknown) =>
						(note as Record<string, unknown>).type === "DiscussionNote",
				)
				.map((note: unknown) => {
					const n = note as Record<string, unknown>;
					return {
						id: n.id,
						noteable_id: n.noteable_id,
						body: n.body,
						author_name: (n.author as Record<string, unknown>)?.name,
					};
				});

			const diffNotes = unresolvedNotes
				.filter(
					(note: unknown) =>
						(note as Record<string, unknown>).type === "DiffNote",
				)
				.map((note: unknown) => {
					const n = note as Record<string, unknown>;
					return {
						id: n.id,
						noteable_id: n.noteable_id,
						body: n.body,
						author_name: (n.author as Record<string, unknown>)?.name,
						position: n.position,
					};
				});

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(
							{
								discussionNotes,
								diffNotes,
							},
							null,
							2,
						),
					},
				],
			};
		} catch (error) {
			console.error("Error fetching merge request comments:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

const addMergeRequestCommentSchema = {
	project_id: z.number().describe("The project ID of the merge request"),
	merge_request_iid: z
		.number()
		.describe("The internal ID of the merge request within the project"),
	comment: z.string().describe("The comment text"),
};

const addMergeRequestCommentTool = createParameterizedTool({
	name: "addMergeRequestComment",
	auth: gitlabAuth,
	description: "Add a general comment to a merge request",
	paramsSchema: addMergeRequestCommentSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}
			const api = new Gitlab({
				oauthToken: extra?.auth?.access_token,
			});

			const note = await api.MergeRequestDiscussions.create(
				args.project_id,
				args.merge_request_iid,
				args.comment,
			);

			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(note, null, 2) },
				],
			};
		} catch (error) {
			console.error("Error adding merge request comment:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

const addMergeRequestDiffCommentSchema = {
	project_id: z.number().describe("The project ID of the merge request"),
	merge_request_iid: z
		.number()
		.describe("The internal ID of the merge request within the project"),
	comment: z.string().describe("The comment text"),
	base_sha: z.string().describe("The SHA of the base commit"),
	start_sha: z.string().describe("The SHA of the start commit"),
	head_sha: z.string().describe("The SHA of the head commit"),
	file_path: z.string().describe("The path to the file being commented on"),
	line_number: z
		.string()
		.describe("The line number in the new version of the file"),
};

const addMergeRequestDiffCommentTool = createParameterizedTool({
	name: "addMergeRequestDiffComment",
	auth: gitlabAuth,
	description:
		"Add a comment of a merge request at a specific line in a file diff",
	paramsSchema: addMergeRequestDiffCommentSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}
			const api = new Gitlab({
				oauthToken: extra?.auth?.access_token,
			});

			const discussion = await api.MergeRequestDiscussions.create(
				args.project_id,
				args.merge_request_iid,
				args.comment,
				{
					position: {
						baseSha: args.base_sha,
						startSha: args.start_sha,
						headSha: args.head_sha,
						oldPath: args.file_path,
						newPath: args.file_path,
						positionType: "text",
						newLine: args.line_number,
					},
				},
			);

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(discussion, null, 2),
					},
				],
			};
		} catch (error) {
			console.error("Error adding merge request diff comment:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

const getMergeRequestDiffSchema = {
	project_id: z.number().describe("The project ID of the merge request"),
	merge_request_iid: z
		.number()
		.describe("The internal ID of the merge request within the project"),
};

const getMergeRequestDiffTool = createParameterizedTool({
	name: "getMergeRequestDiff",
	auth: gitlabAuth,
	description: "Get the file diffs of a certain merge request",
	paramsSchema: getMergeRequestDiffSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}
			const api = new Gitlab({
				oauthToken: extra?.auth?.access_token,
			});

			const diff = await api.MergeRequests.allDiffs(
				args.project_id,
				args.merge_request_iid,
			);

			const diffText =
				Array.isArray(diff) && diff.length > 0
					? JSON.stringify(diff, null, 2)
					: "No diff data available for this merge request.";

			return {
				content: [{ type: "text" as const, text: diffText }],
			};
		} catch (error) {
			console.error("Error fetching merge request diff:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

const getIssueDetailsSchema = {
	project_id: z.number().describe("The project ID of the issue"),
	issue_iid: z
		.number()
		.describe("The internal ID of the issue within the project"),
	verbose: z
		.boolean()
		.default(false)
		.describe(
			"By default a filtered version is returned, suitable for most cases. Only set true if more information is needed.",
		),
};

const getIssueDetailsTool = createParameterizedTool({
	name: "getIssueDetails",
	auth: gitlabAuth,
	description: "Get details of an issue within a certain project",
	paramsSchema: getIssueDetailsSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}
			const api = new Gitlab({
				oauthToken: extra?.auth?.access_token,
			});

			const issue = await api.Issues.show(args.issue_iid, {
				projectId: args.project_id,
			});

			const filteredIssue = args.verbose
				? issue
				: {
						title: issue.title,
						description: issue.description,
					};

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(filteredIssue, null, 2),
					},
				],
			};
		} catch (error) {
			console.error("Error fetching issue details:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

const setMergeRequestDescriptionSchema = {
	project_id: z.number().describe("The project ID of the merge request"),
	merge_request_iid: z
		.number()
		.describe("The internal ID of the merge request within the project"),
	description: z.string().describe("The description text"),
};

const setMergeRequestDescriptionTool = createParameterizedTool({
	name: "setMergeRequestDescription",
	auth: gitlabAuth,
	description: "Set the description of a merge request",
	paramsSchema: setMergeRequestDescriptionSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}
			const api = new Gitlab({
				oauthToken: extra?.auth?.access_token,
			});

			const mr = await api.MergeRequests.edit(
				args.project_id,
				args.merge_request_iid,
				{ description: args.description },
			);

			return {
				content: [{ type: "text" as const, text: JSON.stringify(mr, null, 2) }],
			};
		} catch (error) {
			console.error("Error setting merge request description:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

const setMergeRequestTitleSchema = {
	project_id: z.number().describe("The project ID of the merge request"),
	merge_request_iid: z
		.number()
		.describe("The internal ID of the merge request within the project"),
	title: z.string().describe("The title of the merge request"),
};

const setMergeRequestTitleTool = createParameterizedTool({
	name: "setMergeRequestTitle",
	auth: gitlabAuth,
	description: "Set the title of a merge request",
	paramsSchema: setMergeRequestTitleSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				return formatErrorResponse(
					new Error("Auth Connection is invalid. Please re-authenticate."),
				);
			}
			const api = new Gitlab({
				oauthToken: extra?.auth?.access_token,
			});

			const mr = await api.MergeRequests.edit(
				args.project_id,
				args.merge_request_iid,
				{ title: args.title },
			);

			return {
				content: [{ type: "text" as const, text: JSON.stringify(mr, null, 2) }],
			};
		} catch (error) {
			console.error("Error setting merge request title:", error);
			return formatErrorResponse(error as Error);
		}
	},
});

export const gitlabTools = [
	getProjectsTool,
	listOpenMergeRequestsTool,
	getMergeRequestDetailsTool,
	getMergeRequestCommentsTool,
	addMergeRequestCommentTool,
	addMergeRequestDiffCommentTool,
	getMergeRequestDiffTool,
	getIssueDetailsTool,
	setMergeRequestDescriptionTool,
	setMergeRequestTitleTool,
];
