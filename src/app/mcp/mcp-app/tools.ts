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
import type { ZodRawShape, z } from "zod/v4";
import { McpRunStatus } from "@/db/schema";
import { mcpRunService } from "@/services/mcp-run-service";
import type { AppPropValueSchema } from "./property";
import type { McpAppAuthProperty } from "./property/authentication";

export type ILoggingContext = {
	enabled: boolean;
	serverId: string;
	appId: string;
	appName: string;
	ownerId: string;
	maxRetries?: number;
};

export type Callback<
	McpAppAuth extends McpAppAuthProperty,
	Args extends ZodRawShape,
> = (auth: McpAppAuth, args: Args) => Promise<unknown>;

// Enhanced RequestHandlerExtra that includes auth and logging context
export type McpRequestHandlerExtra<McpAppAuth extends McpAppAuthProperty> =
	RequestHandlerExtra<ServerRequest, ServerNotification> & {
		auth?: AppPropValueSchema<McpAppAuth>;
		loggingContext?: ILoggingContext;
	};

// Custom tool callback that includes auth in extra
export type McpToolCallback<
	McpAppAuth extends McpAppAuthProperty,
	Args extends ZodRawShape | undefined = undefined,
> = Args extends ZodRawShape
	? (
			args: z.infer<z.ZodObject<Args>>,
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
		args: z.infer<z.ZodObject<Args>>,
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

/**
 * Wraps a tool callback with logging functionality and retry logic
 */
async function createLoggingWrapper<McpAppAuth extends McpAppAuthProperty>(
	toolName: string,
	callback: (
		args: Record<string, unknown>,
		extra: McpRequestHandlerExtra<McpAppAuth>,
	) => CallToolResult | Promise<CallToolResult>,
): Promise<
	(
		args: Record<string, unknown>,
		extra: McpRequestHandlerExtra<McpAppAuth>,
	) => Promise<CallToolResult>
> {
	return async (
		args: Record<string, unknown>,
		extra: McpRequestHandlerExtra<McpAppAuth>,
	): Promise<CallToolResult> => {
		let runId: string | undefined;
		const maxRetries = extra.loggingContext?.maxRetries ?? 0;
		let lastError: unknown;

		// Retry loop
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				// Only log if we have logging context and it's the first attempt
				if (extra.loggingContext?.enabled && attempt === 0) {
					// Create a run record
					runId = await mcpRunService.createRun({
						serverId: extra.loggingContext.serverId,
						appId: extra.loggingContext.appId,
						appName: extra.loggingContext.appName,
						toolName,
						input: args,
						ownerId: extra.loggingContext.ownerId,
					});
				}

				// Execute the actual tool callback
				const result = await callback(args, extra);

				if (result.isError && attempt < maxRetries) {
					throw new Error(
						typeof result.content === "string"
							? result.content
							: JSON.stringify(result.content),
					);
				}

				// Log success
				if (runId && extra.loggingContext?.enabled) {
					await mcpRunService.updateRunResult(runId, {
						output: result,
						status: result.isError ? McpRunStatus.FAILED : McpRunStatus.SUCCESS,
					});
				}

				return result;
			} catch (error) {
				lastError = error;

				// If this is the last attempt, log failure and throw
				if (attempt === maxRetries) {
					if (runId && extra.loggingContext?.enabled) {
						await mcpRunService.updateRunResult(runId, {
							output: {
								error: error instanceof Error ? error.message : String(error),
								attempts: attempt + 1,
							},
							status: McpRunStatus.FAILED,
						});
					}
					break;
				}

				// Optional: Add delay between retries (exponential backoff)
				if (attempt < maxRetries) {
					const delay = Math.min(1000 * 2 ** attempt, 10000); // Cap at 10 seconds
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		// Re-throw the last error
		throw lastError;
	};
}

/**
 * Wraps a simple tool callback (no args) with logging functionality and retry logic
 */
async function createSimpleLoggingWrapper<
	McpAppAuth extends McpAppAuthProperty,
>(
	toolName: string,
	callback: (
		extra: McpRequestHandlerExtra<McpAppAuth>,
	) => CallToolResult | Promise<CallToolResult>,
): Promise<
	(extra: McpRequestHandlerExtra<McpAppAuth>) => Promise<CallToolResult>
> {
	return async (
		extra: McpRequestHandlerExtra<McpAppAuth>,
	): Promise<CallToolResult> => {
		let runId: string | undefined;
		const maxRetries = extra.loggingContext?.maxRetries ?? 0;
		let lastError: unknown;

		// Retry loop
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				// Only log if we have logging context and it's the first attempt
				if (extra.loggingContext?.enabled && attempt === 0) {
					// Create a run record with empty args
					runId = await mcpRunService.createRun({
						serverId: extra.loggingContext.serverId,
						appId: extra.loggingContext.appId,
						appName: extra.loggingContext.appName,
						toolName,
						input: {},
						ownerId: extra.loggingContext.ownerId,
					});
				}

				// Execute the actual tool callback
				const result = await callback(extra);

				// Log success
				if (runId && extra.loggingContext?.enabled) {
					await mcpRunService.updateRunResult(runId, {
						output: result,
						status: result.isError ? McpRunStatus.FAILED : McpRunStatus.SUCCESS,
					});
				}

				return result;
			} catch (error) {
				lastError = error;

				// If this is the last attempt, log failure and throw
				if (attempt === maxRetries) {
					if (runId && extra.loggingContext) {
						await mcpRunService.updateRunResult(runId, {
							output: {
								error: error instanceof Error ? error.message : String(error),
								attempts: attempt + 1,
							},
							status: McpRunStatus.FAILED,
						});
					}
					break;
				}

				// Optional: Add delay between retries (exponential backoff)
				if (attempt < maxRetries) {
					const delay = Math.min(1000 * 2 ** attempt, 10000); // Cap at 10 seconds
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		// Re-throw the last error
		throw lastError;
	};
}

// Helper function to register a tool with McpServer
export async function registerTool<McpAppAuth extends McpAppAuthProperty>(
	server: McpServer,
	config: AnyMcpToolConfig<McpAppAuth>,
	authValue: AppPropValueSchema<McpAppAuth> | undefined,
	loggingContext?: ILoggingContext,
): Promise<RegisteredTool> {
	let wrappedCallback: ToolCallback<ZodRawShape> | ToolCallback<undefined>;

	if ("paramsSchema" in config) {
		// Parameterized tool
		const originalCallback = (
			config as McpParameterizedToolConfig<McpAppAuth, ZodRawShape>
		).callback;

		const loggingCallback = await createLoggingWrapper(
			config.name,
			originalCallback,
		);

		wrappedCallback = (async (
			args: Record<string, unknown>,
			extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
		) => {
			const enhancedExtra: McpRequestHandlerExtra<McpAppAuth> = {
				...extra,
				auth: authValue,
				loggingContext,
			};
			return await loggingCallback(args, enhancedExtra);
		}) as ToolCallback<ZodRawShape>;
	} else {
		// Simple tool
		const originalCallback = (config as McpSimpleToolConfig).callback;

		const loggingCallback = await createSimpleLoggingWrapper(
			config.name,
			originalCallback,
		);

		wrappedCallback = (async (
			extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
		) => {
			const enhancedExtra: McpRequestHandlerExtra<McpAppAuth> = {
				...extra,
				auth: authValue,
				loggingContext,
			};
			return await loggingCallback(enhancedExtra);
		}) as ToolCallback<undefined>;
	}

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
