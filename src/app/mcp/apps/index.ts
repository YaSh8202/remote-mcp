import { fetchMcpApp } from "./fetch";
import { githubMcpApp } from "./github";
import { gitlabMcpApp } from "./gitlab";
import { youtubeMcpApp } from "./youtube";

export const mcpApps = [githubMcpApp, gitlabMcpApp, fetchMcpApp, youtubeMcpApp];
