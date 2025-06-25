import type { OAuth2AuthorizationMethod } from "@/app/mcp/mcp-app/property";
import type { OAuth2GrantType } from "@/app/mcp/mcp-app/property/authentication/oauth2-prop";
import type { AppConnectionSchema, AppConnectionType } from "@/db/schema";

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

export type AppConnectionValue<
	T extends AppConnectionType = AppConnectionType,
> = T extends AppConnectionType.OAUTH2 ? OAuth2ConnectionValueWithApp : never;

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
