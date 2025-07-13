import type {
	McpServer,
	RegisteredTool,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
	McpAppBase,
	McpAppCategory,
	McpAppLogo,
	McpAppMetadata,
} from "./app-metadata";
import type { AppPropValueSchema } from "./property";
import type { McpAppAuthProperty } from "./property/authentication";
import { type AnyMcpToolConfig, registerTool } from "./tools";

export class McpApp<McpAppAuth extends McpAppAuthProperty = McpAppAuthProperty>
	implements McpAppBase
{
	constructor(
		public readonly name: string,
		public readonly displayName: string,
		public readonly description: string,
		public readonly logo: McpAppLogo,
		public readonly categories: McpAppCategory[],
		public auth: McpAppAuth | undefined,
		public tools: AnyMcpToolConfig<McpAppAuth>[],
	) {}

	// Register all tools with the MCP server
	async registerTools(
		server: McpServer,
		auth: AppPropValueSchema<McpAppAuth>,
		selectedTools: string[],
		loggingContext: {
			serverId: string;
			appId: string;
			appName: string;
			ownerId: string;
		},
	): Promise<RegisteredTool[]> {
		const registeredTools: RegisteredTool[] = [];
		for (const toolConfig of this.tools) {
			if (
				Array.isArray(selectedTools) &&
				selectedTools.length > 0 &&
				!selectedTools.includes(toolConfig.name)
			) {
				continue; // Skip tools not selected
			}

			const registeredTool = await registerTool(
				server,
				{ ...toolConfig, name: `${this.name}-${toolConfig.name}` },
				auth,
				loggingContext,
			);
			registeredTools.push(registeredTool);
		}
		return registeredTools;
	}

	metadata(): McpAppMetadata {
		return {
			name: this.name,
			displayName: this.displayName,
			description: this.description,
			logo: this.logo,
			categories: this.categories,
			auth: this.auth,
			tools: this.tools.map((tool) => ({
				name: tool.name,
				description: "description" in tool ? tool.description : undefined,
				paramsSchema: "paramsSchema" in tool ? tool.paramsSchema : undefined,
				annotations: "annotations" in tool ? tool.annotations : undefined,
			})),
		};
	}
}

export const createMcpApp = <
	McpAppAuth extends McpAppAuthProperty = McpAppAuthProperty,
>(
	params: CreateMcpAppParams<McpAppAuth>,
): McpApp<McpAppAuth> => {
	return new McpApp<McpAppAuth>(
		params.name,
		params.displayName,
		params.description,
		params.logo,
		params.categories,
		params.auth,
		params.tools,
	);
};

type CreateMcpAppParams<
	McpAppAuth extends McpAppAuthProperty = McpAppAuthProperty,
> = {
	name: string;
	displayName: string;
	description: string;
	logo: McpAppLogo;
	categories: McpAppCategory[];
	auth: McpAppAuth | undefined;
	tools: AnyMcpToolConfig<McpAppAuth>[];
};

// Re-export types for external use
export type {
	McpAppMetadata,
	McpAppCategory,
	McpAppLogo,
	McpAppBase,
} from "./app-metadata";
