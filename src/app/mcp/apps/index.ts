import { braveMcpApp } from "./brave";
import { fetchMcpApp } from "./fetch";
import { githubMcpApp } from "./github";
import { gitlabMcpApp } from "./gitlab";
import { postgresMcpApp } from "./postgres";
import { slackMcpApp } from "./slack";
import { youtubeMcpApp } from "./youtube";

export const mcpApps = [githubMcpApp, gitlabMcpApp, fetchMcpApp, youtubeMcpApp, slackMcpApp, braveMcpApp, postgresMcpApp];
