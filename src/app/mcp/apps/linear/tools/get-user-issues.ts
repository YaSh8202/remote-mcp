import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { LinearClient } from "@linear/sdk";
import { z } from "zod";
import { formatError, linearAuth } from "../common";

const getUserIssuesSchema = {
	userId: z
		.string()
		.optional()
		.describe(
			"Optional user ID. If not provided, returns authenticated user's issues",
		),
	includeArchived: z
		.boolean()
		.optional()
		.describe("Include archived issues in results"),
	limit: z
		.number()
		.optional()
		.describe("Maximum number of issues to return (default: 50)"),
};

export const getUserIssuesTool = createParameterizedTool({
	name: "getUserIssues",
	auth: linearAuth,
	description:
		"Retrieves issues assigned to a specific user or the authenticated user if no userId is provided. Returns issues sorted by last updated, including priority, status, and other metadata. Useful for finding a user's workload or tracking assigned tasks.",
	paramsSchema: getUserIssuesSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey || typeof apiKey !== "string") {
				throw new Error("Linear API key is required");
			}

			const client = new LinearClient({ apiKey });

			const user =
				args.userId && typeof args.userId === "string"
					? await client.user(args.userId)
					: await client.viewer;

			const result = await user.assignedIssues({
				first: (args.limit as number) || 50,
				includeArchived: args.includeArchived as boolean | undefined,
			});

			if (!result?.nodes) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Found 0 issues",
						},
					],
				};
			}

			// Get detailed information for each issue
			const issuesWithDetails = await Promise.all(
				result.nodes.map(async (issue) => {
					const state = await issue.state;
					return {
						id: issue.id,
						identifier: issue.identifier,
						title: issue.title,
						description: issue.description,
						priority: issue.priority,
						stateName: state?.name || "Unknown",
						url: issue.url,
					};
				}),
			);

			const issuesText = issuesWithDetails
				.map(
					(issue) =>
						`- ${issue.identifier}: ${issue.title}\n  Priority: ${issue.priority || "None"}\n  Status: ${issue.stateName}\n  ${issue.url}`,
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
			console.error("Error getting user issues:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting user issues: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
