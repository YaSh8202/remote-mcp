import { Octokit } from "octokit";
import { z } from "zod";
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { formatError, githubAuth } from "../common";

// Get authenticated user info
const getMeSchema = {
	reason: z
		.string()
		.optional()
		.describe("Optional: the reason for requesting the user information"),
};

const getMeTool = createParameterizedTool({
	name: "getMe",
	auth: githubAuth,
	description:
		'Get details of the authenticated GitHub user. Use this when a request includes "me", "my". The output will not change unless the user changes their profile, so only call this once.',
	paramsSchema: getMeSchema,
	callback: async (_args, extra) => {
		try {
			const octokit = new Octokit({
				auth:
					extra?.auth?.access_token || process.env.GITHUB_TOKEN || undefined,
			});

			const { data } = await octokit.rest.users.getAuthenticated();

			return {
				content: [
					{
						type: "text" as const,
						text: `Authenticated user details:\n\n${JSON.stringify(data, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting user:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting user: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

export { getMeTool };
