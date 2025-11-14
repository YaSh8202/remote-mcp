import { LinearClient } from "@linear/sdk";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { formatError, linearAuth } from "../common";

const createIssueSchema = {
	title: z.string().describe("Issue title"),
	teamId: z.string().describe("Team ID to create the issue in"),
	description: z
		.string()
		.optional()
		.describe("Issue description (markdown supported)"),
	priority: z
		.number()
		.min(0)
		.max(4)
		.optional()
		.describe(
			"Priority level (0=no priority, 1=urgent, 2=high, 3=normal, 4=low)",
		),
	stateId: z.string().optional().describe("Initial workflow state ID (status)"),
};

export const createIssueTool = createParameterizedTool({
	name: "createIssue",
	auth: linearAuth,
	description:
		"Creates a new Linear issue with specified details. Use this to create tickets for tasks, bugs, or feature requests. Returns the created issue's identifier and URL. Required fields are title and teamId, with optional description, priority (0-4), and stateId.",
	paramsSchema: createIssueSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey || typeof apiKey !== "string") {
				throw new Error("Linear API key is required");
			}

			const client = new LinearClient({ apiKey });

			const issuePayload = await client.createIssue({
				title: args.title as string,
				teamId: args.teamId as string,
				description: args.description as string | undefined,
				priority: args.priority as number | undefined,
				stateId: args.stateId as string | undefined,
			});

			const issue = await issuePayload.issue;
			if (!issue) {
				throw new Error("Failed to create issue");
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Created issue ${issue.identifier}: ${issue.title}\nURL: ${issue.url}`,
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
