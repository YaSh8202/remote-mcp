import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { LinearClient } from "@linear/sdk";
import { z } from "zod";
import { formatError, linearAuth } from "../common";

const addCommentSchema = {
	issueId: z.string().describe("ID of the issue to comment on"),
	body: z.string().describe("Comment text in markdown format"),
	createAsUser: z
		.string()
		.optional()
		.describe("Optional custom username to show for the comment"),
	displayIconUrl: z
		.string()
		.optional()
		.describe("Optional avatar URL for the comment"),
};

export const addCommentTool = createParameterizedTool({
	name: "addComment",
	auth: linearAuth,
	description:
		"Adds a comment to an existing Linear issue. Supports markdown formatting in the comment body. Can optionally specify a custom user name and avatar for the comment. Returns the created comment's details including its URL.",
	paramsSchema: addCommentSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey || typeof apiKey !== "string") {
				throw new Error("Linear API key is required");
			}

			const client = new LinearClient({ apiKey });

			const commentPayload = await client.createComment({
				issueId: args.issueId as string,
				body: args.body as string,
				createAsUser: args.createAsUser as string | undefined,
				displayIconUrl: args.displayIconUrl as string | undefined,
			});

			const comment = await commentPayload.comment;
			if (!comment) {
				throw new Error("Failed to create comment");
			}

			const issue = await comment.issue;

			return {
				content: [
					{
						type: "text" as const,
						text: `Added comment to issue ${issue?.identifier}\nURL: ${comment.url}`,
					},
				],
			};
		} catch (error) {
			console.error("Error adding comment:", error);
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
