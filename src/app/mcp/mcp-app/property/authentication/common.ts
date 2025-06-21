import { z } from "zod";
// import { ServerContext } from '../../context';

export const BaseMcpAppAuthSchema = z.object({
	displayName: z.string(),
	description: z.string().optional(),
});

export type BaseMcpAppAuthSchema = {
	displayName: string;
	description?: string;
	// TODO: Re-enable when ServerContext is available
	// validate?: (params: { auth: AuthValueSchema; server: Omit<ServerContext, 'token'> }) => Promise<
	//   | { valid: true }
	//   | {
	//   valid: false;
	//   error: string;
	// }
	// >;
};
