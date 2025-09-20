import { z } from "zod/v4";
import { PropertyType } from "../input/property-type";
import { BasicAuthProperty } from "./basic-auth-prop";
import { CustomAuthProperty, type CustomAuthProps } from "./custom-auth-prop";
import { OAuth2Property } from "./oauth2-prop";
import type { OAuth2Props } from "./oauth2-prop";
import { SecretTextProperty } from "./secret-text-property";

export const McpAppAuthProperty = z.union([
	BasicAuthProperty,
	CustomAuthProperty,
	OAuth2Property,
	SecretTextProperty,
]);

// export type McpAppAuthProperty = z.infer<typeof McpAppAuthProperty>;

export type McpAppAuthProperty =
	| BasicAuthProperty
	| CustomAuthProperty<CustomAuthProps>
	| OAuth2Property<OAuth2Props>
	| SecretTextProperty<boolean>;

type AuthProperties<T> = Omit<Properties<T>, "displayName">;

type Properties<T> = Omit<
	T,
	"valueSchema" | "type" | "defaultValidators" | "defaultProcessors"
>;

export const McpAppAuth = {
	SecretText<R extends boolean>(
		request: Properties<SecretTextProperty<R>>,
	): R extends true ? SecretTextProperty<true> : SecretTextProperty<false> {
		return {
			...request,
			valueSchema: undefined,
			type: PropertyType.SECRET_TEXT,
			required: true,
		} as unknown as R extends true
			? SecretTextProperty<true>
			: SecretTextProperty<false>;
	},
	OAuth2<T extends OAuth2Props>(
		request: AuthProperties<OAuth2Property<T>>,
	): OAuth2Property<T> {
		return {
			...request,
			valueSchema: undefined,
			type: PropertyType.OAUTH2,
			displayName: "Connection",
		} as unknown as OAuth2Property<T>;
	},
	BasicAuth(request: AuthProperties<BasicAuthProperty>): BasicAuthProperty {
		return {
			...request,
			valueSchema: undefined,
			type: PropertyType.BASIC_AUTH,
			displayName: "Connection",
			required: true,
		} as unknown as BasicAuthProperty;
	},
	CustomAuth<T extends CustomAuthProps>(
		request: AuthProperties<CustomAuthProperty<T>>,
	): CustomAuthProperty<T> {
		return {
			...request,
			valueSchema: undefined,
			type: PropertyType.CUSTOM_AUTH,
			displayName: "Connection",
		} as unknown as CustomAuthProperty<T>;
	},
	None() {
		return undefined;
	},
};
