import { LinearClient } from "@linear/sdk";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { formatError, linearAuth } from "../common";

const updateIssueSchema = {
	id: z.string().describe("Issue ID to update"),
	title: z.string().optional().describe("New title for the issue"),
	description: z.string().optional().describe("New description for the issue"),
	priority: z
		.number()
		.min(0)
		.max(4)
		.optional()
		.describe(
			"New priority (0=no priority, 1=urgent, 2=high, 3=normal, 4=low)",
		),
	stateId: z.string().optional().describe("New workflow state ID (status)"),
};

export const updateIssueTool = createParameterizedTool({
	name: "updateIssue",
	auth: linearAuth,
	description:
		"Updates an existing Linear issue's properties. Use this to modify issue details like title, description, priority, or status. Requires the issue ID and accepts any combination of updatable fields. Returns the updated issue's identifier and URL.",
	paramsSchema: updateIssueSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey || typeof apiKey !== "string") {
				throw new Error("Linear API key is required");
			}

			const client = new LinearClient({ apiKey });

			const issue = await client.issue(args.id as string);
			if (!issue) {
				throw new Error(`Issue ${args.id} not found`);
			}

			const updatePayload = await issue.update({
				title: args.title as string | undefined,
				description: args.description as string | undefined,
				priority: args.priority as number | undefined,
				stateId: args.stateId as string | undefined,
			});

			const updatedIssue = await updatePayload.issue;
			if (!updatedIssue) {
				throw new Error("Failed to update issue");
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Updated issue ${updatedIssue.identifier}\nURL: ${updatedIssue.url}`,
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
