import type { McpApp } from "../mcp-app";
import { atlassianMcpApp } from "./atlassian";
import { braveMcpApp } from "./brave";
import { fetchMcpApp } from "./fetch";
import { githubMcpApp } from "./github";
import { gitlabMcpApp } from "./gitlab";
import { googleDriveMcpApp } from "./google-drive";
import { notionMcpApp } from "./notion";
import { postgresMcpApp } from "./postgres";
import { slackMcpApp } from "./slack";
import { spotifyMcpApp } from "./spotify";
import { youtubeMcpApp } from "./youtube";

export const mcpApps = [
	githubMcpApp,
	gitlabMcpApp,
	atlassianMcpApp,
	fetchMcpApp,
	youtubeMcpApp,
	slackMcpApp,
	braveMcpApp,
	postgresMcpApp,
	notionMcpApp,
	spotifyMcpApp,
	googleDriveMcpApp,
] as McpApp[];
