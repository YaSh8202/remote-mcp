import { z } from "zod/v4";

export enum OAuth2AuthorizationMethod {
	HEADER = "HEADER",
	BODY = "BODY",
}

export const MCPAppAuthType = z.enum(["OAUTH2", "NO_AUTH"]);

export type MCPAppAuthType = z.infer<typeof MCPAppAuthType>;

export const OAuth2ExtraProps = z.object({
	authUrl: z
		.string()
		.url()
		.describe("The URL to initiate OAuth2 authentication"),
	tokenUrl: z
		.string()
		.url()
		.describe("The URL to exchange the authorization code for an access token"),
	scope: z
		.array(z.string())
		.describe("The scopes required for the OAuth2 authentication"),
	authMethod: z
		.nativeEnum(OAuth2AuthorizationMethod)
		.optional()
		.describe("The method of authorization (HEADER or BODY)"),
	extra: z
		.record(z.string(), z.string())
		.optional()
		.describe("Additional properties for OAuth2 configuration"),
});

export const OAuth2PropertyValue = z.object({
	access_token: z
		.string()
		.describe("The access token obtained after OAuth2 authentication"),
	data: z
		.record(z.string(), z.any())
		.optional()
		.describe("Additional data returned from the OAuth2 provider"),
	required: z.boolean().describe("Whether this OAuth2 property is required"),
	type: z.literal(MCPAppAuthType.enum.OAUTH2),
});

export const OAuth2Property = OAuth2ExtraProps.merge(OAuth2PropertyValue);

export const McpAppAuthProperty = OAuth2Property;

export type McpAppAuthProperty = z.infer<typeof McpAppAuthProperty>;
