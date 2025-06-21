import { z } from "zod";
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

export type SecretTextProperty<R extends boolean> = BaseMcpAppAuthSchema &
	TPropertyValue<string, PropertyType.SECRET_TEXT, R>;
