import { z } from "zod/v4";
// import { ServerContext } from '../../context';

export const BaseMcpAppAuthSchema = z.object({
	displayName: z.string(),
	description: z.string().optional(),
});

export type BaseMcpAppAuthSchema<AuthValueSchema> = {
	displayName: string;
	description?: string;
	validate?: (params: { auth: AuthValueSchema }) => Promise<
		| { valid: true }
		| {
				valid: false;
				error: string;
		  }
	>;
};
