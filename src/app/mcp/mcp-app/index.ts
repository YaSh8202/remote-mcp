import type {
	McpServer,
	RegisteredTool,
	ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
	CallToolResult,
	ServerNotification,
	ServerRequest,
	ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import z, { type ZodRawShape } from "zod";
import { McpAppAuthProperty } from "./auth";

export enum McpAppCategory {
	DEVELOPER_TOOLS = "DEVELOPER_TOOLS",
	PRODUCTIVITY = "PRODUCTIVITY",
}

export type Callback<
	McpAppAuth extends McpAppAuthProperty,
	Args extends ZodRawShape,
> = (auth: McpAppAuth, args: Args) => Promise<unknown>;

// Enhanced RequestHandlerExtra that includes auth
export type McpRequestHandlerExtra = RequestHandlerExtra<
	ServerRequest,
	ServerNotification
> & {
	auth?: McpAppAuthProperty;
};

// Custom tool callback that includes auth in extra
export type McpToolCallback<Args extends ZodRawShape | undefined = undefined> =
	Args extends ZodRawShape
		? (
				args: z.objectOutputType<Args, z.ZodTypeAny>,
				extra: McpRequestHandlerExtra,
			) => CallToolResult | Promise<CallToolResult>
		: (
				extra: McpRequestHandlerExtra,
			) => CallToolResult | Promise<CallToolResult>;

// Simplified tool type for zero-argument tools
export interface McpSimpleToolConfig {
	name: string;
	description?: string;
	callback: (
		extra: McpRequestHandlerExtra,
	) => CallToolResult | Promise<CallToolResult>;
}

// Tool type with parameters - more flexible callback type
export interface McpParameterizedToolConfig<Args extends ZodRawShape> {
	name: string;
	description?: string;
	paramsSchema: Args;
	annotations?: ToolAnnotations;
	callback: (
		args: Record<string, unknown>,
		extra: McpRequestHandlerExtra,
	) => CallToolResult | Promise<CallToolResult>;
}

// Union type for all tool configurations
export type AnyMcpToolConfig =
	| McpSimpleToolConfig
	| McpParameterizedToolConfig<ZodRawShape>;

// Helper function to create a simple tool (no parameters)
export function createSimpleTool(
	config: McpSimpleToolConfig,
): McpSimpleToolConfig {
	return config;
}

// Helper function to create a parameterized tool
export function createParameterizedTool<Args extends ZodRawShape>(config: {
	name: string;
	description?: string;
	paramsSchema: Args;
	annotations?: ToolAnnotations;
	callback: (
		args: z.objectOutputType<Args, z.ZodTypeAny>,
		extra: McpRequestHandlerExtra,
	) => CallToolResult | Promise<CallToolResult>;
}): McpParameterizedToolConfig<Args> {
	return {
		name: config.name,
		description: config.description,
		paramsSchema: config.paramsSchema,
		annotations: config.annotations,
		callback: config.callback as (
			args: Record<string, unknown>,
			extra: McpRequestHandlerExtra,
		) => CallToolResult | Promise<CallToolResult>,
	};
}

// Helper function to register a tool with McpServer
export function registerTool(
	server: McpServer,
	config: AnyMcpToolConfig,
	authOverride?: McpAppAuthProperty,
): RegisteredTool {
	const wrappedCallback =
		"paramsSchema" in config
			? (((
					args: Record<string, unknown>,
					extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
				) => {
					const enhancedExtra: McpRequestHandlerExtra = {
						...extra,
						auth:
							authOverride ||
							(extra.authInfo
								? (extra.authInfo as unknown as McpAppAuthProperty)
								: undefined),
					};
					return (config as McpParameterizedToolConfig<ZodRawShape>).callback(
						args as z.objectOutputType<ZodRawShape, z.ZodTypeAny>,
						enhancedExtra,
					);
				}) as ToolCallback<ZodRawShape>)
			: (((extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
					const enhancedExtra: McpRequestHandlerExtra = {
						...extra,
						auth:
							authOverride ||
							(extra.authInfo
								? (extra.authInfo as unknown as McpAppAuthProperty)
								: undefined),
					};
					return (config as McpSimpleToolConfig).callback(enhancedExtra);
				}) as ToolCallback<undefined>);

	if ("paramsSchema" in config) {
		const paramConfig = config as McpParameterizedToolConfig<ZodRawShape>;
		if (paramConfig.description && paramConfig.annotations) {
			return server.tool(
				paramConfig.name,
				paramConfig.description,
				paramConfig.paramsSchema,
				paramConfig.annotations,
				wrappedCallback as ToolCallback<ZodRawShape>,
			);
		}
		if (paramConfig.description) {
			return server.tool(
				paramConfig.name,
				paramConfig.description,
				paramConfig.paramsSchema,
				wrappedCallback as ToolCallback<ZodRawShape>,
			);
		}
		if (paramConfig.annotations) {
			return server.tool(
				paramConfig.name,
				paramConfig.paramsSchema,
				paramConfig.annotations,
				wrappedCallback as ToolCallback<ZodRawShape>,
			);
		}
		return server.tool(
			paramConfig.name,
			paramConfig.paramsSchema,
			wrappedCallback as ToolCallback<ZodRawShape>,
		);
	}

	const simpleConfig = config as McpSimpleToolConfig;
	if (simpleConfig.description) {
		return server.tool(
			simpleConfig.name,
			simpleConfig.description,
			wrappedCallback as ToolCallback<undefined>,
		);
	}
	return server.tool(
		simpleConfig.name,
		wrappedCallback as ToolCallback<undefined>,
	);
}

export const McpAppMetadata = z.object({
	name: z.string(),
	description: z.string(),
	logoUrl: z.string().url(),
	categories: z.array(z.nativeEnum(McpAppCategory)),
	auth: McpAppAuthProperty,
	tools: z.array(
		z.object({
			name: z.string(),
			description: z.string().optional(),
			paramsSchema: z.object({}).passthrough().optional(),
			annotations: z.object({}).passthrough().optional(),
		}),
	),
});

export type McpAppMetadata = z.infer<typeof McpAppMetadata>;

export class McpApp<
	McpAppAuth extends McpAppAuthProperty = McpAppAuthProperty,
> {
	constructor(
		public readonly name: string,
		public readonly description: string,
		public readonly logoUrl: string,
		public readonly categories: McpAppCategory[],
		public auth: McpAppAuth,
		public tools: AnyMcpToolConfig[],
	) {}

	// Register all tools with the MCP server
	registerTools(
		server: McpServer,
		authOverride?: McpAppAuth,
	): RegisteredTool[] {
		const authToUse = authOverride || this.auth;
		return this.tools.map((toolConfig) =>
			registerTool(server, toolConfig, authToUse),
		);
	}

	metadata(): McpAppMetadata {
		return {
			name: this.name,
			description: this.description,
			logoUrl: this.logoUrl,
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
