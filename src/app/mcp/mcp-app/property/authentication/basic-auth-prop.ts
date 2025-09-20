import { z } from "zod/v4";
import { TPropertyValue } from "../input/common";
import { PropertyType } from "../input/property-type";
import { BaseMcpAppAuthSchema } from "./common";

export const BasicAuthPropertyValue = z.object({
	username: z.string(),
	password: z.string(),
});

export type BasicAuthPropertyValue = z.infer<typeof BasicAuthPropertyValue>;

export const BasicAuthProperty = z.object({
	...BaseMcpAppAuthSchema.shape,
	username: z.object({
		displayName: z.string(),
		description: z.string().optional(),
	}),
	password: z.object({
		displayName: z.string(),
		description: z.string().optional(),
	}),
	...TPropertyValue(BasicAuthPropertyValue, PropertyType.BASIC_AUTH).shape,
});

export type BasicAuthProperty = BaseMcpAppAuthSchema<BasicAuthPropertyValue> & {
	username: {
		displayName: string;
		description?: string;
	};
	password: {
		displayName: string;
		description?: string;
	};
} & TPropertyValue<BasicAuthPropertyValue, PropertyType.BASIC_AUTH, boolean>;
