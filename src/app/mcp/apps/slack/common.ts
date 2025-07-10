import { McpAppAuth } from "../../mcp-app/property";

export const slackAuth = McpAppAuth.OAuth2({
	description: "",
	authUrl:
		"https://slack.com/oauth/v2/authorize?user_scope=search:read,users.profile:write,reactions:read,im:history,stars:read,channels:write,groups:write,im:write,mpim:write,channels:history,groups:history,chat:write,users:read",
	tokenUrl: "https://slack.com/api/oauth.v2.access",
	required: true,
	scope: [
		"channels:read",
		"channels:history",
		"chat:write",
		"groups:read",
		"groups:history",
		// "reactions:read",
		"mpim:read",
		"mpim:write",
		"mpim:history",
		"im:write",
		"im:read",
		"im:history",
		"users:read",
		// "files:write",
		// "files:read",
		// "reactions:write",
		// "usergroups:read",
		// "links:read",
		// "links:write",
		// "emoji:read",
	],
});
