import { z } from "zod/v4";
import { TPropertyValue } from "../input/common";
import { PropertyType } from "../input/property-type";
import { BaseMcpAppAuthSchema } from "./common";

export const SecretTextProperty = z.object({
	...BaseMcpAppAuthSchema.shape,
	...TPropertyValue(
		z.object({
			auth: z.string(),
		}),
		PropertyType.SECRET_TEXT,
	).shape,
});

export type SecretTextProperty<R extends boolean> =
	BaseMcpAppAuthSchema<string> &
		TPropertyValue<string, PropertyType.SECRET_TEXT, R>;
