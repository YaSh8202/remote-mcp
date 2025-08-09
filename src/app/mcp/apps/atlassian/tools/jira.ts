import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { atlassianAuth, formatError } from "../common";
import { findCloudId } from "./context";

// Helper function to make authenticated Jira API calls
async function makeJiraRequest(
	accessToken: string,
	cloudId: string,
	endpoint: string,
	options: RequestInit = {}
) {
	const baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
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

// Get Jira issue details
const getIssueSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	issueKey: z.string().describe("Jira issue key (e.g., 'PROJ-123')"),
	fields: z.string().optional().describe("Comma-separated list of fields to retrieve"),
};

const getIssueTool = createParameterizedTool({
	name: "getJiraIssue",
	auth: atlassianAuth,
	description: "Get details of a specific Jira issue.",
	paramsSchema: getIssueSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const endpoint = `/rest/api/3/issue/${args.issueKey}${args.fields ? `?fields=${args.fields}` : ""}`;
			const issue = await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint);

			return {
				content: [
					{
						type: "text" as const,
						text: `Jira issue ${args.issueKey} details:\n\n${JSON.stringify(issue, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting Jira issue:", error);
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

// Search Jira issues
const searchIssuesSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	jql: z.string().describe("JQL query string"),
	fields: z.string().optional().describe("Comma-separated list of fields to retrieve"),
	maxResults: z.number().optional().default(50).describe("Maximum number of results"),
	startAt: z.number().optional().default(0).describe("Starting index for pagination"),
};

const searchIssuesTool = createParameterizedTool({
	name: "searchJiraIssues",
	auth: atlassianAuth,
	description: "Search Jira issues using JQL (Jira Query Language).",
	paramsSchema: searchIssuesSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const params = new URLSearchParams({
				jql: args.jql,
				maxResults: args.maxResults.toString(),
				startAt: args.startAt.toString(),
			});

			if (args.fields) {
				params.set("fields", args.fields);
			}

			const endpoint = `/rest/api/3/search?${params.toString()}`;
			const results = await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint);

			return {
				content: [
					{
						type: "text" as const,
						text: `Jira search results for "${args.jql}":\n\n${JSON.stringify(results, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error searching Jira issues:", error);
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

// Create Jira issue
const createIssueSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	projectKey: z.string().describe("Project key (e.g., 'PROJ')"),
	summary: z.string().describe("Issue summary/title"),
	issueType: z.string().describe("Issue type (e.g., 'Task', 'Bug', 'Story')"),
	description: z.string().optional().describe("Issue description"),
	assignee: z.string().optional().describe("Assignee account ID"),
	priority: z.string().optional().describe("Priority name (e.g., 'High', 'Medium', 'Low')"),
	labels: z.array(z.string()).optional().describe("Array of label names"),
	components: z.array(z.string()).optional().describe("Array of component names"),
};

const createIssueTool = createParameterizedTool({
	name: "createJiraIssue",
	auth: atlassianAuth,
	description: "Create a new Jira issue.",
	paramsSchema: createIssueSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const issueData = {
				fields: {
					project: { key: args.projectKey },
					summary: args.summary,
					issuetype: { name: args.issueType },
					...(args.description && { description: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: args.description }] }] } }),
					...(args.assignee && { assignee: { accountId: args.assignee } }),
					...(args.priority && { priority: { name: args.priority } }),
					...(args.labels && { labels: args.labels.map(label => ({ name: label })) }),
					...(args.components && { components: args.components.map(comp => ({ name: comp })) }),
				},
			};

			const endpoint = "/rest/api/3/issue";
			const issue = await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint, {
				method: "POST",
				body: JSON.stringify(issueData),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Created Jira issue successfully:\n\n${JSON.stringify(issue, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error creating Jira issue:", error);
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

// Update Jira issue
const updateIssueSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	issueKey: z.string().describe("Jira issue key (e.g., 'PROJ-123')"),
	summary: z.string().optional().describe("Updated summary/title"),
	description: z.string().optional().describe("Updated description"),
	assignee: z.string().optional().describe("Updated assignee account ID"),
	priority: z.string().optional().describe("Updated priority name"),
	labels: z.array(z.string()).optional().describe("Updated array of label names"),
};

const updateIssueTool = createParameterizedTool({
	name: "updateJiraIssue",
	auth: atlassianAuth,
	description: "Update an existing Jira issue.",
	paramsSchema: updateIssueSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const updateData = {
				fields: {
					...(args.summary && { summary: args.summary }),
					...(args.description && { description: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: args.description }] }] } }),
					...(args.assignee && { assignee: { accountId: args.assignee } }),
					...(args.priority && { priority: { name: args.priority } }),
					...(args.labels && { labels: args.labels.map(label => ({ name: label })) }),
				},
			};

			const endpoint = `/rest/api/3/issue/${args.issueKey}`;
			await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint, {
				method: "PUT",
				body: JSON.stringify(updateData),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Updated Jira issue ${args.issueKey} successfully`,
					},
				],
			};
		} catch (error) {
			console.error("Error updating Jira issue:", error);
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

// Transition Jira issue
const transitionIssueSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	issueKey: z.string().describe("Jira issue key (e.g., 'PROJ-123')"),
	transitionId: z.string().describe("Transition ID"),
	comment: z.string().optional().describe("Optional comment for the transition"),
};

const transitionIssueTool = createParameterizedTool({
	name: "transitionJiraIssue",
	auth: atlassianAuth,
	description: "Transition a Jira issue to a new status.",
	paramsSchema: transitionIssueSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const transitionData = {
				transition: { id: args.transitionId },
				...(args.comment && {
					update: {
						comment: [{ add: { body: { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: args.comment }] }] } } }],
					},
				}),
			};

			const endpoint = `/rest/api/3/issue/${args.issueKey}/transitions`;
			await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint, {
				method: "POST",
				body: JSON.stringify(transitionData),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Transitioned Jira issue ${args.issueKey} successfully`,
					},
				],
			};
		} catch (error) {
			console.error("Error transitioning Jira issue:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error transitioning issue: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Add comment to Jira issue
const addCommentSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	issueKey: z.string().describe("Jira issue key (e.g., 'PROJ-123')"),
	comment: z.string().describe("Comment text"),
};

const addCommentTool = createParameterizedTool({
	name: "addJiraComment",
	auth: atlassianAuth,
	description: "Add a comment to a Jira issue.",
	paramsSchema: addCommentSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const commentData = {
				body: {
					type: "doc",
					version: 1,
					content: [
						{
							type: "paragraph",
							content: [{ type: "text", text: args.comment }],
						},
					],
				},
			};

			const endpoint = `/rest/api/3/issue/${args.issueKey}/comment`;
			const comment = await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint, {
				method: "POST",
				body: JSON.stringify(commentData),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Added comment to Jira issue ${args.issueKey}:\n\n${JSON.stringify(comment, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error adding comment to Jira issue:", error);
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

// Get user profile
const getUserProfileSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	accountId: z.string().describe("User account ID"),
};

const getUserProfileTool = createParameterizedTool({
	name: "getJiraUserProfile",
	auth: atlassianAuth,
	description: "Get Jira user profile information.",
	paramsSchema: getUserProfileSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const endpoint = `/rest/api/3/user?accountId=${args.accountId}`;
			const user = await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint);

			return {
				content: [
					{
						type: "text" as const,
						text: `Jira user profile for ${args.accountId}:\n\n${JSON.stringify(user, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting Jira user profile:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting user profile: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get all projects
const getAllProjectsSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
};

const getAllProjectsTool = createParameterizedTool({
	name: "getAllJiraProjects",
	auth: atlassianAuth,
	description: "Get all accessible Jira projects.",
	paramsSchema: getAllProjectsSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const endpoint = "/rest/api/3/project";
			const projects = await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint);

			return {
				content: [
					{
						type: "text" as const,
						text: `All Jira projects:\n\n${JSON.stringify(projects, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting Jira projects:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting projects: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get all projects (auto-detecting cloud ID)
const getAllProjectsAutoSchema = {};

const getAllProjectsAutoTool = createParameterizedTool({
	name: "getAllJiraProjectsAuto",
	auth: atlassianAuth,
	description: "Get all accessible Jira projects (automatically detects cloud ID).",
	paramsSchema: getAllProjectsAutoSchema,
	callback: async (_args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			// Auto-detect cloud ID
			const cloudId = await findCloudId(extra.auth.access_token, true);
			if (!cloudId) {
				throw new Error("No accessible Jira sites found. Please ensure you have access to at least one Jira instance.");
			}

			const endpoint = "/rest/api/3/project";
			const projects = await makeJiraRequest(extra.auth.access_token, cloudId, endpoint);

			return {
				content: [
					{
						type: "text" as const,
						text: `All Jira projects (Cloud ID: ${cloudId}):\n\n${JSON.stringify(projects, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting Jira projects:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting projects: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get transitions for an issue
const getTransitionsSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	issueKey: z.string().describe("Jira issue key (e.g., 'PROJ-123')"),
};

const getTransitionsTool = createParameterizedTool({
	name: "getJiraTransitions",
	auth: atlassianAuth,
	description: "Get available transitions for a Jira issue.",
	paramsSchema: getTransitionsSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const endpoint = `/rest/api/3/issue/${args.issueKey}/transitions`;
			const transitions = await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint);

			return {
				content: [
					{
						type: "text" as const,
						text: `Available transitions for ${args.issueKey}:\n\n${JSON.stringify(transitions, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting Jira transitions:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting transitions: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Add worklog to issue
const addWorklogSchema = {
	cloudId: z.string().describe("Atlassian Cloud ID"),
	issueKey: z.string().describe("Jira issue key (e.g., 'PROJ-123')"),
	timeSpent: z.string().describe("Time spent (e.g., '2h 30m', '1d 4h')"),
	comment: z.string().optional().describe("Optional worklog comment"),
	started: z.string().optional().describe("When work started (ISO 8601 format)"),
};

const addWorklogTool = createParameterizedTool({
	name: "addJiraWorklog",
	auth: atlassianAuth,
	description: "Add a worklog entry to a Jira issue.",
	paramsSchema: addWorklogSchema,
	callback: async (args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const worklogData = {
				timeSpent: args.timeSpent,
				...(args.comment && {
					comment: {
						type: "doc",
						version: 1,
						content: [{ type: "paragraph", content: [{ type: "text", text: args.comment }] }],
					},
				}),
				...(args.started && { started: args.started }),
			};

			const endpoint = `/rest/api/3/issue/${args.issueKey}/worklog`;
			const worklog = await makeJiraRequest(extra.auth.access_token, args.cloudId, endpoint, {
				method: "POST",
				body: JSON.stringify(worklogData),
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Added worklog to ${args.issueKey}:\n\n${JSON.stringify(worklog, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error adding worklog:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error adding worklog: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

export {
	getIssueTool,
	searchIssuesTool,
	createIssueTool,
	updateIssueTool,
	transitionIssueTool,
	addCommentTool,
	getUserProfileTool,
	getAllProjectsTool,
	getAllProjectsAutoTool,
	getTransitionsTool,
	addWorklogTool,
};
