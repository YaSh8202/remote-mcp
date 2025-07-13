import { z } from "zod";
import type { StaticPropsValue } from "..";
import { CheckboxProperty } from "../input/checkbox-property";
import { TPropertyValue } from "../input/common";
import { StaticDropdownProperty } from "../input/dropdown/static-dropdown";
import { NumberProperty } from "../input/number-property";
import { PropertyType } from "../input/property-type";
import { LongTextProperty, ShortTextProperty } from "../input/text-property";
import { BaseMcpAppAuthSchema } from "./common";
import type { SecretTextProperty } from "./secret-text-property";

const CustomAuthProps = z.record(
	z.string(),
	z.union([
		ShortTextProperty,
		LongTextProperty,
		NumberProperty,
		CheckboxProperty,
		StaticDropdownProperty,
	]),
);

export type CustomAuthProps = Record<
	string,
	| ShortTextProperty<boolean>
	| LongTextProperty<boolean>
	| SecretTextProperty<boolean>
	| NumberProperty<boolean>
	| StaticDropdownProperty<unknown, boolean>
	| CheckboxProperty<boolean>
>;

export const CustomAuthProperty = z.object({
	...BaseMcpAppAuthSchema.shape,
	props: CustomAuthProps,
	...TPropertyValue(z.unknown(), PropertyType.CUSTOM_AUTH).shape,
});

export type CustomAuthProperty<T extends CustomAuthProps> =
	BaseMcpAppAuthSchema<StaticPropsValue<T>> & {
		props: T;
	} & TPropertyValue<StaticPropsValue<T>, PropertyType.CUSTOM_AUTH, true>;
