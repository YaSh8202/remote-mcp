import { OAuth2AuthorizationMethod } from "@/app/mcp/mcp-app/property";
import type { OAuth2GrantType } from "@/app/mcp/mcp-app/property/authentication/oauth2-prop";
import { type AppConnectionSchema, AppConnectionType } from "@/db/schema";
import { z } from "zod";

export type BaseOAuth2ConnectionValue = {
	expires_in?: number;
	client_id: string;
	token_type: string;
	access_token: string;
	claimed_at: number;
	refresh_token: string;
	scope: string;
	token_url: string;
	authorization_method?: OAuth2AuthorizationMethod;
	data: Record<string, unknown>;
	props?: Record<string, string>;
	grant_type?: OAuth2GrantType;
};

export type OAuth2ConnectionValueWithApp = {
	type: AppConnectionType.OAUTH2;
	client_secret: string;
	redirect_url: string;
} & BaseOAuth2ConnectionValue;

export type NoAuthConnectionValue = {
	type: AppConnectionType.NO_AUTH;
};

export type SecretTextConnectionValue = {
	type: AppConnectionType.SECRET_TEXT;
	secret_text: string;
};

export type AppConnectionValue<
	T extends AppConnectionType = AppConnectionType,
> = T extends AppConnectionType.SECRET_TEXT
	? SecretTextConnectionValue
	: T extends AppConnectionType.OAUTH2
		? OAuth2ConnectionValueWithApp
		: T extends AppConnectionType.NO_AUTH
			? NoAuthConnectionValue
			: never;

export type OAuth2Service<CONNECTION_VALUE extends BaseOAuth2ConnectionValue> =
	{
		claim(request: ClaimOAuth2Request): Promise<CONNECTION_VALUE>;
		refresh(
			request: RefreshOAuth2Request<CONNECTION_VALUE>,
		): Promise<CONNECTION_VALUE>;
	};

export type RefreshOAuth2Request<T extends BaseOAuth2ConnectionValue> = {
	appName: string;
	ownerId: string;
	connectionValue: T;
};

export type OAuth2RequestBody = {
	props?: Record<string, string>;
	code: string;
	clientId: string;
	tokenUrl: string;
	clientSecret?: string;
	redirectUrl?: string;
	grantType?: OAuth2GrantType;
	authorizationMethod?: OAuth2AuthorizationMethod;
	codeVerifier?: string;
	scope?: string;
};

export type ClaimOAuth2Request = {
	appName: string;
	request: OAuth2RequestBody;
};

export type AppConnection<Type extends AppConnectionType = AppConnectionType> =
	Omit<AppConnectionSchema, "value"> & {
		type: Type;
		value: AppConnectionValue<Type>;
	};

export const commonAuthProps = z.object({
	displayName: z.string().min(1, "Display name is required"),
	appName: z.string().min(1, "App name is required"),
});

export const UpsertNoAuthRequest = z.object({
	...commonAuthProps.shape,
	type: z.literal(AppConnectionType.NO_AUTH),
	value: z.object({
		type: z.literal(AppConnectionType.NO_AUTH),
	}),
});

export const UpsertOAuth2Request = z.object({
	...commonAuthProps.shape,
	type: z.literal(AppConnectionType.OAUTH2),
	value: z.object({
		client_id: z.string().min(1, "Client ID is required"),
		code: z.string().min(1, "Code is required"),
		code_challenge: z.string().optional(),
		authorization_method: z.nativeEnum(OAuth2AuthorizationMethod).optional(),
		scope: z.string().optional(),
		props: z.record(z.string(), z.any()).optional(),
		type: z.literal(AppConnectionType.OAUTH2),
		redirect_url: z.string().min(1, "Redirect URL is required"),
	}),
});

export type UpsertOAuth2Request = z.infer<typeof UpsertOAuth2Request>;

export const UpsertSecretTextRequest = z.object({
	...commonAuthProps.shape,
	type: z.literal(AppConnectionType.SECRET_TEXT),
	value: z.object({
		type: z.literal(AppConnectionType.SECRET_TEXT),
		secret_text: z.string().min(1, "Secret is required"),
	}),
});

export const UpsertAppConnectionRequestBody = z.discriminatedUnion("type", [
	UpsertSecretTextRequest,
	UpsertOAuth2Request,
	UpsertNoAuthRequest,
]);

export type UpsertAppConnectionRequestBody = z.infer<
	typeof UpsertAppConnectionRequestBody
>;

export type ConnectionValue =
	| OAuth2ConnectionValueWithApp
	| Record<string, unknown>
	| string
	| undefined;
