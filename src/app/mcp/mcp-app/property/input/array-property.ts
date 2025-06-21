import { z } from "zod";
import { CheckboxProperty } from "./checkbox-property";
import { BasePropertySchema, TPropertyValue } from "./common";
import { MultiSelectDropdownProperty } from "./dropdown/dropdown-prop";
import {
	StaticDropdownProperty,
	StaticMultiSelectDropdownProperty,
} from "./dropdown/static-dropdown";
import { JsonProperty } from "./json-property";
import { NumberProperty } from "./number-property";
import { PropertyType } from "./property-type";
import { LongTextProperty, ShortTextProperty } from "./text-property";

export const ArraySubProperties = z.record(
	z.string(),
	z.union([
		ShortTextProperty,
		LongTextProperty,
		StaticDropdownProperty,
		MultiSelectDropdownProperty,
		StaticMultiSelectDropdownProperty,
		CheckboxProperty,
		NumberProperty,
		JsonProperty,
	]),
);

export const ArrayProperty = z.object({
	...BasePropertySchema.shape,
	properties: ArraySubProperties.optional(),
	...TPropertyValue(z.array(z.unknown()), PropertyType.ARRAY).shape,
});

export type ArraySubProperties<R extends boolean> = Record<
	string,
	| ShortTextProperty<R>
	| LongTextProperty<R>
	| StaticDropdownProperty<unknown, R>
	| MultiSelectDropdownProperty<unknown, R>
	| StaticMultiSelectDropdownProperty<unknown, R>
	| CheckboxProperty<R>
	| NumberProperty<R>
	| JsonProperty<R>
>;

export type ArrayProperty<R extends boolean> = BasePropertySchema & {
	properties?: ArraySubProperties<R>;
} & TPropertyValue<unknown[], PropertyType.ARRAY, R>;
