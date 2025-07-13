import { z } from "zod";
import type { StaticPropsValue } from "..";
import { TPropertyValue } from "../input/common";
import { StaticDropdownProperty } from "../input/dropdown/static-dropdown";
import { PropertyType } from "../input/property-type";
import { ShortTextProperty } from "../input/text-property";
import { BaseMcpAppAuthSchema } from "./common";
import { SecretTextProperty } from "./secret-text-property";

export const BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE =
	"both_client_credentials_and_authorization_code";

export enum OAuth2GrantType {
	AUTHORIZATION_CODE = "authorization_code",
	CLIENT_CREDENTIALS = "client_credentials",
}

export enum OAuth2AuthorizationMethod {
	HEADER = "HEADER",
	BODY = "BODY",
}

const OAuthProp = z.union([
	ShortTextProperty,
	SecretTextProperty,
	StaticDropdownProperty,
]);

type OAuthProp =
	| ShortTextProperty<boolean>
	| SecretTextProperty<boolean>
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	| StaticDropdownProperty<any, true>;

export const OAuth2Props = z.record(z.string(), OAuthProp);

export type OAuth2Props = {
	[key: string]: OAuthProp;
};

type OAuthPropsValue<T extends OAuth2Props> = StaticPropsValue<T>;

const OAuth2ExtraProps = z.object({
	props: z.record(z.string(), OAuthProp).optional(),
	authUrl: z.string(),
	tokenUrl: z.string(),
	scope: z.array(z.string()),
	pkce: z.boolean().optional(),
	authorizationMethod: z.nativeEnum(OAuth2AuthorizationMethod).optional(),
	grantType: z
		.union([
			z.nativeEnum(OAuth2GrantType),
			z.literal(BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE),
		])
		.optional(),
	extra: z.record(z.string(), z.string()).optional(),
});

type OAuth2ExtraProps = {
	props?: OAuth2Props;
	authUrl: string;
	tokenUrl: string;
	scope: string[];
	pkce?: boolean;
	authorizationMethod?: OAuth2AuthorizationMethod;
	grantType?:
		| OAuth2GrantType
		| typeof BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE;
	extra?: Record<string, string>;
};

export const OAuth2PropertyValue = z.object({
	access_token: z.string(),
	props: OAuth2Props.optional(),
	data: z.record(z.string(), z.any()),
});

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type OAuth2PropertyValue<T extends OAuth2Props = any> = {
	access_token: string;
	props?: OAuthPropsValue<T>;
	data: Record<string, unknown>;
};

export const OAuth2Property = z.object({
	...BaseMcpAppAuthSchema.shape,
	...OAuth2ExtraProps.shape,
	...TPropertyValue(OAuth2PropertyValue, PropertyType.OAUTH2).shape,
});

export type OAuth2Property<T extends OAuth2Props> =
	BaseMcpAppAuthSchema<OAuth2PropertyValue> &
		OAuth2ExtraProps &
		TPropertyValue<OAuth2PropertyValue<T>, PropertyType.OAUTH2, true>;
