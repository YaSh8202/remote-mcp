import { z } from "zod";
import { BasePropertySchema, TPropertyValue } from "../common";
import { PropertyType } from "../property-type";
import type { DropdownState } from "./common";

// Temporary interface - should be imported from proper context
interface PropertyContext {
	[key: string]: unknown;
}

type DynamicDropdownOptions<T> = (
	propsValue: Record<string, unknown>,
	ctx: PropertyContext,
) => Promise<DropdownState<T>>;

export const DropdownProperty = z.object({
	...BasePropertySchema.shape,
	...TPropertyValue(z.unknown(), PropertyType.DROPDOWN).shape,
	refreshers: z.array(z.string()),
});

export type DropdownProperty<T, R extends boolean> = BasePropertySchema & {
	refreshers: string[];
	refreshOnSearch?: boolean;
	options: DynamicDropdownOptions<T>;
} & TPropertyValue<T, PropertyType.DROPDOWN, R>;

export const MultiSelectDropdownProperty = z.object({
	...BasePropertySchema.shape,
	...TPropertyValue(z.array(z.unknown()), PropertyType.MULTI_SELECT_DROPDOWN)
		.shape,
	refreshers: z.array(z.string()),
});

export type MultiSelectDropdownProperty<
	T,
	R extends boolean,
> = BasePropertySchema & {
	refreshers: string[];
	options: DynamicDropdownOptions<T>;
} & TPropertyValue<T[], PropertyType.MULTI_SELECT_DROPDOWN, R>;
