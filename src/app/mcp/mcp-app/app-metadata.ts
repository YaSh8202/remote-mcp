import { z } from "zod/v4";
import { McpAppAuthProperty } from "./property/authentication";
import type { AnyMcpToolConfig } from "./tools";

export type McpAppLogo = z.infer<typeof McpAppLogo>;

export enum McpAppCategory {
	DEVELOPER_TOOLS = "DEVELOPER_TOOLS",
	PRODUCTIVITY = "PRODUCTIVITY",
	COMMUNICATION = "COMMUNICATION",
	ENTERTAINMENT = "ENTERTAINMENT",
	DATA_STORAGE = "DATA_STORAGE",
	SEARCH = "SEARCH",
}

export const McpAppLogo = z.union([
	z.object({
		type: z.literal("icon"),
		icon: z.string(),
	}),
	z.object({
		type: z.literal("url"),
		url: z.string().url(),
	}),
]);

export const McpAppBase = z.object({
	name: z.string(),
	displayName: z.string(),
	description: z.string(),
	logo: McpAppLogo,
	auth: z.optional(McpAppAuthProperty),
	categories: z.nativeEnum(McpAppCategory).array(),
});

// export type McpAppBase = z.infer<typeof McpAppBase>;

export type McpAppBase = {
	name: string;
	displayName: string;
	description: string;
	logo: McpAppLogo;
	auth?: McpAppAuthProperty;
	categories: McpAppCategory[];
};

export const McpAppMetadata = z.object({
	...McpAppBase.shape,
	tools: z.array(
		z.object({
			name: z.string(),
			description: z.string().optional(),
			paramsSchema: z.object({}).passthrough().optional(),
			annotations: z.object({}).passthrough().optional(),
		}),
	),
});

export type McpAppMetadata = McpAppBase & {
	tools: Omit<AnyMcpToolConfig, "callback">[];
};
