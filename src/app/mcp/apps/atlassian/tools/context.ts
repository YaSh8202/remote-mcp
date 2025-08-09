import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { atlassianAuth, formatError } from "../common";

// Helper function to get current user info from access token
async function getAtlassianUserInfo(accessToken: string) {
	try {
		const response = await fetch("https://api.atlassian.com/me", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		throw new Error(`Failed to get user info: ${formatError(error)}`);
	}
}

// Helper function to get accessible Atlassian resources (includes cloud IDs)
async function getAccessibleResources(accessToken: string) {
	try {
		const response = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		throw new Error(`Failed to get accessible resources: ${formatError(error)}`);
	}
}

// Helper function to find the best cloud ID from accessible resources
async function findCloudId(accessToken: string, preferJira = true): Promise<string | null> {
	try {
		const resources = await getAccessibleResources(accessToken);
		
		if (!Array.isArray(resources) || resources.length === 0) {
			return null;
		}

		// Find the first resource with appropriate scopes
		const jiraResource = resources.find((resource: { scopes?: string[] }) => 
			resource.scopes?.some((scope: string) => scope.includes('jira'))
		);
		
		const confluenceResource = resources.find((resource: { scopes?: string[] }) => 
			resource.scopes?.some((scope: string) => scope.includes('confluence'))
		);

		if (preferJira && jiraResource) {
			return (jiraResource as { id: string }).id;
		}
		
		if (confluenceResource) {
			return (confluenceResource as { id: string }).id;
		}
		
		if (jiraResource) {
			return (jiraResource as { id: string }).id;
		}

		// Return the first available resource if no specific type found
		return (resources[0] as { id?: string })?.id || null;
	} catch (error) {
		console.error("Error finding cloud ID:", error);
		return null;
	}
}

const getAtlassianUserTool = createParameterizedTool({
	name: "getAtlassianUser",
	auth: atlassianAuth,
	description: "Get details of the authenticated Atlassian user.",
	paramsSchema: {},
	callback: async (_args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const userInfo = await getAtlassianUserInfo(extra.auth.access_token);

			return {
				content: [
					{
						type: "text" as const,
						text: `Current Atlassian user details:\n\n${JSON.stringify(userInfo, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting Atlassian user:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting user info: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

const getAccessibleResourcesTool = createParameterizedTool({
	name: "getAccessibleResources",
	auth: atlassianAuth,
	description: "Get list of accessible Atlassian resources with their cloud IDs, scopes, and site information.",
	paramsSchema: {},
	callback: async (_args, extra) => {
		try {
			if (!extra?.auth?.access_token) {
				throw new Error("No access token available");
			}

			const resources = await getAccessibleResources(extra.auth.access_token);

			return {
				content: [
					{
						type: "text" as const,
						text: `Accessible Atlassian resources:\n\n${JSON.stringify(resources, null, 2)}`,
					},
				],
			};
		} catch (error) {
			console.error("Error getting accessible resources:", error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting accessible resources: ${formatError(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

export { getAtlassianUserTool, getAccessibleResourcesTool, findCloudId };
