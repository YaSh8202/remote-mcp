import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape, z } from "zod";
import type { McpAppAuthProperty } from "./auth";

export enum McpAppCategory {
	DEVELOPER_TOOLS = "DEVELOPER_TOOLS",
	PRODUCTIVITY = "PRODUCTIVITY",
}

export type Callback<
	McpAppAuth extends McpAppAuthProperty,
	Args extends ZodRawShape,
> = (auth: McpAppAuth, args: Args) => Promise<unknown>;

export type McpTool<Args extends ZodRawShape = Record<string, z.ZodTypeAny>> = {
	name: string;
	description?: string;
	paramsSchema?: Args;
	callback: MCPToolCallback<Args>;
};

export type AnyMcpTool = McpTool<ZodRawShape>;

export type MCPToolCallback<
	Args extends ZodRawShape = Record<string, z.ZodTypeAny>,
> = (
	args: { [K in keyof Args]: z.infer<Args[K]> },
	extra?: {
		auth?: McpAppAuthProperty;
	},
) => ReturnType<ToolCallback<Args>>;

// Helper function to create a tool with proper type inference
export function createMcpTool<T extends ZodRawShape>({
	name,
	description,
	paramsSchema,
	callback,
}: {
	name: string;
	description?: string;
	paramsSchema: T;
	callback: MCPToolCallback<T>;
}): McpTool<T> {
	return {
		name,
		description,
		paramsSchema,
		callback,
	};
}

// tool<Args extends ZodRawShape>(name: string, paramsSchemaOrAnnotations: Args | ToolAnnotations, cb: ToolCallback<Args>): RegisteredTool;

export class McpApp<
	McpAppAuth extends McpAppAuthProperty = McpAppAuthProperty,
> {
	constructor(
		public readonly name: string,
		public readonly description: string,
		public readonly categories: McpAppCategory[],
		public auth: McpAppAuth,
		public tools: McpTool[],
	) {}
}
