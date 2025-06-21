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
import type { ZodRawShape, z } from "zod";
import type { AppPropValueSchema } from "./property";
import type { McpAppAuthProperty } from "./property/authentication";

export type Callback<
	McpAppAuth extends McpAppAuthProperty,
	Args extends ZodRawShape,
> = (auth: McpAppAuth, args: Args) => Promise<unknown>;

// Enhanced RequestHandlerExtra that includes auth
export type McpRequestHandlerExtra<McpAppAuth extends McpAppAuthProperty> =
	RequestHandlerExtra<ServerRequest, ServerNotification> & {
		auth?: AppPropValueSchema<McpAppAuth>;
	};

// Custom tool callback that includes auth in extra
export type McpToolCallback<
	McpAppAuth extends McpAppAuthProperty,
	Args extends ZodRawShape | undefined = undefined,
> = Args extends ZodRawShape
	? (
			args: z.objectOutputType<Args, z.ZodTypeAny>,
			extra: McpRequestHandlerExtra<McpAppAuth>,
		) => CallToolResult | Promise<CallToolResult>
	: (
			extra: McpRequestHandlerExtra<McpAppAuth>,
		) => CallToolResult | Promise<CallToolResult>;

// Simplified tool type for zero-argument tools
export interface McpSimpleToolConfig<
	McpAppAuth extends McpAppAuthProperty = McpAppAuthProperty,
> {
	name: string;
	description?: string;
	callback: (
		extra: McpRequestHandlerExtra<McpAppAuth>,
	) => CallToolResult | Promise<CallToolResult>;
}

// Tool type with parameters - more flexible callback type
export interface McpParameterizedToolConfig<
	McpAppAuth extends McpAppAuthProperty = McpAppAuthProperty,
	Args extends ZodRawShape = ZodRawShape,
> {
	name: string;
	description?: string;
	paramsSchema: Args;
	annotations?: ToolAnnotations;
	callback: (
		args: Record<string, unknown>,
		extra: McpRequestHandlerExtra<McpAppAuth>,
	) => CallToolResult | Promise<CallToolResult>;
}

// Union type for all tool configurations
export type AnyMcpToolConfig<
	McpAppAuth extends McpAppAuthProperty = McpAppAuthProperty,
> = McpSimpleToolConfig | McpParameterizedToolConfig<McpAppAuth, ZodRawShape>;

// Helper function to create a simple tool (no parameters)
export function createSimpleTool(
	config: McpSimpleToolConfig,
): McpSimpleToolConfig {
	return config;
}

// Helper function to create a parameterized tool
export function createParameterizedTool<
	Args extends ZodRawShape,
	McpAppAuth extends McpAppAuthProperty = McpAppAuthProperty,
>(config: {
	name: string;
	auth: McpAppAuth | undefined;
	description?: string;
	paramsSchema: Args;
	annotations?: ToolAnnotations;
	callback: (
		args: z.objectOutputType<Args, z.ZodTypeAny>,
		extra: McpRequestHandlerExtra<McpAppAuth>,
	) => CallToolResult | Promise<CallToolResult>;
}): McpParameterizedToolConfig<McpAppAuth, Args> {
	return {
		name: config.name,
		description: config.description,
		paramsSchema: config.paramsSchema,
		annotations: config.annotations,
		callback: config.callback as (
			args: Record<string, unknown>,
			extra: McpRequestHandlerExtra<McpAppAuth>,
		) => CallToolResult | Promise<CallToolResult>,
	};
}

// Helper function to register a tool with McpServer
export function registerTool<McpAppAuth extends McpAppAuthProperty>(
	server: McpServer,
	config: AnyMcpToolConfig<McpAppAuth>,
	auth: McpAppAuth | undefined,
): RegisteredTool {
	const wrappedCallback =
		"paramsSchema" in config
			? (((
					args: Record<string, unknown>,
					extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
				) => {
					const enhancedExtra: McpRequestHandlerExtra<McpAppAuth> = {
						...extra,
						auth: auth?.valueSchema as AppPropValueSchema<McpAppAuth>,
					};
					return (
						config as McpParameterizedToolConfig<McpAppAuth, ZodRawShape>
					).callback(
						args as z.objectOutputType<ZodRawShape, z.ZodTypeAny>,
						enhancedExtra,
					);
				}) as ToolCallback<ZodRawShape>)
			: (((extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
					const enhancedExtra: McpRequestHandlerExtra<McpAppAuth> = {
						...extra,
						auth: auth?.valueSchema as AppPropValueSchema<McpAppAuth>,
					};
					return (config as McpSimpleToolConfig).callback(enhancedExtra);
				}) as ToolCallback<undefined>);

	if ("paramsSchema" in config) {
		const paramConfig = config as McpParameterizedToolConfig<
			McpAppAuth,
			ZodRawShape
		>;
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
