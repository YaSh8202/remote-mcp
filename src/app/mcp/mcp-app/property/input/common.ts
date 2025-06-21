import { z } from "zod";
import type { PropertyType } from "./property-type";

export const BasePropertySchema = z.object({
	displayName: z.string(),
	description: z.string().optional(),
});

export type BasePropertySchema = z.infer<typeof BasePropertySchema>;

export const TPropertyValue = <T extends z.ZodSchema, U extends PropertyType>(
	_schema: T,
	propertyType: U,
) =>
	z.object({
		type: z.literal(propertyType),
		required: z.boolean(),
		defaultValue: z.any().optional(),
	});

export type TPropertyValue<
	T,
	U extends PropertyType,
	REQUIRED extends boolean,
> = {
	valueSchema: T;
	type: U;
	required: REQUIRED;
	// TODO this should be T or undefined
	defaultValue?: U extends PropertyType.ARRAY
		? unknown[]
		: U extends PropertyType.JSON
			? object
			: U extends PropertyType.CHECKBOX
				? boolean
				: U extends PropertyType.LONG_TEXT
					? string
					: U extends PropertyType.SHORT_TEXT
						? string
						: U extends PropertyType.NUMBER
							? number
							: U extends PropertyType.DROPDOWN
								? unknown
								: U extends PropertyType.MULTI_SELECT_DROPDOWN
									? unknown[]
									: U extends PropertyType.STATIC_MULTI_SELECT_DROPDOWN
										? unknown[]
										: U extends PropertyType.STATIC_DROPDOWN
											? unknown
											: U extends PropertyType.DATE_TIME
												? string
												: unknown;
};
