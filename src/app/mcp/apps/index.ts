import type { McpApp } from "../mcp-app";
import { braveMcpApp } from "./brave";
import { fetchMcpApp } from "./fetch";
import { githubMcpApp } from "./github";
import { gitlabMcpApp } from "./gitlab";
import { notionMcpApp } from "./notion";
import { postgresMcpApp } from "./postgres";
import { slackMcpApp } from "./slack";
import { spotifyMcpApp } from "./spotify";
import { youtubeMcpApp } from "./youtube";

export const mcpApps = [
	githubMcpApp,
	gitlabMcpApp,
	fetchMcpApp,
	youtubeMcpApp,
	slackMcpApp,
	braveMcpApp,
	postgresMcpApp,
	notionMcpApp,
	spotifyMcpApp,
] as McpApp[];
