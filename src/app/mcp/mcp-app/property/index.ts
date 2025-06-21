import { z } from "zod";
import { McpAppAuthProperty } from "./authentication";
import { InputProperty } from "./input";
import type { DropdownState } from "./input/dropdown/common";
import type { PropertyType } from "./input/property-type";

// EXPORTED
export {
	DropdownProperty,
	MultiSelectDropdownProperty,
} from "./input/dropdown/dropdown-prop";
export { PropertyType } from "./input/property-type";
export { Property } from "./input";
export { McpAppAuth } from "./authentication";
export { DropdownOption, DropdownState } from "./input/dropdown/common";
export { OAuth2PropertyValue } from "./authentication/oauth2-prop";
export { ShortTextProperty } from "./input/text-property";
export { ArrayProperty, ArraySubProperties } from "./input/array-property";
export { BasePropertySchema } from "./input/common";
export { CheckboxProperty } from "./input/checkbox-property";
export { DateTimeProperty } from "./input/date-time-property";
export { LongTextProperty } from "./input/text-property";
export { NumberProperty } from "./input/number-property";
export { ObjectProperty } from "./input/object-property";
export { OAuth2Props } from "./authentication/oauth2-prop";
export { OAuth2AuthorizationMethod } from "./authentication/oauth2-prop";
export { BasicAuthProperty } from "./authentication/basic-auth-prop";
export { StaticMultiSelectDropdownProperty } from "./input/dropdown/static-dropdown";
export { StaticDropdownProperty } from "./input/dropdown/static-dropdown";
export * from "./authentication/custom-auth-prop";
export { OAuth2Property } from "./authentication/oauth2-prop";
export { SecretTextProperty } from "./authentication/secret-text-property";
export { CustomAuthProperty } from "./authentication/custom-auth-prop";
export { JsonProperty } from "./input/json-property";
export { CustomProperty } from "./input/custom-property";
export type { CustomPropertyCodeFunctionParams } from "./input/custom-property";

export const McpAppProperty = z.union([InputProperty, McpAppAuthProperty]);
export type McpAppProperty = InputProperty | McpAppAuthProperty;

export const PropertyMap = z.record(z.string(), McpAppProperty);
export interface PropertyMap {
	[name: string]: McpAppProperty;
}

export const InputPropertyMap = z.record(z.string(), InputProperty);
export interface InputPropertyMap {
	[name: string]: InputProperty;
}

export type AppPropValueSchema<T extends McpAppProperty> = T extends undefined
	? undefined
	: T extends { required: true }
		? T["valueSchema"]
		: T["valueSchema"] | undefined;

export type StaticPropsValue<T extends PropertyMap> = {
	[P in keyof T]: AppPropValueSchema<T[P]>;
};

export type ExecutePropsResult<
	T extends PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN,
> = {
	type: T;
	options: T extends PropertyType.DROPDOWN
		? DropdownState<unknown>
		: T extends PropertyType.MULTI_SELECT_DROPDOWN
			? DropdownState<unknown>
			: InputPropertyMap;
};
