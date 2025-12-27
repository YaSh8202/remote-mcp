import { LinearClient } from "@linear/sdk";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { formatError, linearAuth } from "../common";

// Define the filter type based on Linear SDK's expected structure
interface LinearIssueFilter {
	or?: Array<
		{ title: { contains: string } } | { description: { contains: string } }
	>;
	team?: { id: { eq: string } };
	state?: { name: { eq: string } };
	assignee?: { id: { eq: string } };
	labels?: {
		some: {
			name: { in: string[] };
		};
	};
	priority?: { eq: number };
	estimate?: { eq: number };
}

const searchIssuesSchema = {
	query: z
		.string()
		.optional()
		.describe("Optional text to search in title and description"),
	teamId: z.string().optional().describe("Filter by team ID"),
	status: z
		.string()
		.optional()
		.describe("Filter by status name (e.g., 'In Progress', 'Done')"),
	assigneeId: z.string().optional().describe("Filter by assignee's user ID"),
	labels: z.array(z.string()).optional().describe("Filter by label names"),
	priority: z
		.number()
		.optional()
		.describe("Filter by priority (1=urgent, 2=high, 3=normal, 4=low)"),
	estimate: z.number().optional().describe("Filter by estimate points"),
	includeArchived: z
		.boolean()
		.optional()
		.describe("Include archived issues in results (default: false)"),
	limit: z.number().optional().describe("Max results to return (default: 10)"),
};

export const searchIssuesTool = createParameterizedTool({
	name: "searchIssues",
	auth: linearAuth,
	description:
		"Searches Linear issues using flexible criteria. Supports filtering by any combination of: title/description text, team, status, assignee, labels, priority (1=urgent, 2=high, 3=normal, 4=low), and estimate. Returns up to 10 issues by default (configurable via limit).",
	paramsSchema: searchIssuesSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey || typeof apiKey !== "string") {
				throw new Error("Linear API key is required");
			}

			const client = new LinearClient({ apiKey });

			// Build search filter
			const filter: LinearIssueFilter = {};

			if (args.query && typeof args.query === "string") {
				filter.or = [
					{ title: { contains: args.query } },
					{ description: { contains: args.query } },
				];
			}

			if (args.teamId && typeof args.teamId === "string") {
				filter.team = { id: { eq: args.teamId } };
			}

			if (args.status && typeof args.status === "string") {
				filter.state = { name: { eq: args.status } };
			}

			if (args.assigneeId && typeof args.assigneeId === "string") {
				filter.assignee = { id: { eq: args.assigneeId } };
			}

			if (Array.isArray(args.labels) && args.labels.length > 0) {
				filter.labels = {
					some: {
						name: { in: args.labels },
					},
				};
			}

			if (typeof args.priority === "number") {
				filter.priority = { eq: args.priority };
			}

			if (typeof args.estimate === "number") {
				filter.estimate = { eq: args.estimate };
			}

			const result = await client.issues({
				filter,
				first: (args.limit as number) || 10,
				includeArchived: args.includeArchived as boolean | undefined,
			});

			// Get detailed information for each issue
			const issuesWithDetails = await Promise.all(
				result.nodes.map(async (issue) => {
					const [state, assignee, labels] = await Promise.all([
						issue.state,
						issue.assignee,
						issue.labels(),
					]);

					return {
						id: issue.id,
						identifier: issue.identifier,
						title: issue.title,
						description: issue.description,
						priority: issue.priority,
						estimate: issue.estimate,
						status: state?.name || null,
						assignee: assignee?.name || null,
						labels: labels?.nodes?.map((label) => label.name) || [],
						url: issue.url,
					};
				}),
			);

			const issuesText = issuesWithDetails
				.map(
					(issue) =>
						`- ${issue.identifier}: ${issue.title}\n  Priority: ${issue.priority || "None"}\n  Status: ${issue.status || "None"}\n  ${issue.url}`,
				)
				.join("\n");

			return {
				content: [
					{
						type: "text" as const,
						text: `Found ${issuesWithDetails.length} issues:\n${issuesText}`,
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
