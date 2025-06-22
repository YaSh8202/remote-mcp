import { auth } from "@/lib/auth";
import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";

export const createContext = async (opts: CreateNextContextOptions) => {
	const session = await auth.api.getSession({
		headers: opts.req.headers,
	});

	return {
		user: session?.user,
		session: session?.session,
	};
};

const t = initTRPC.context<typeof createContext>().create({
	transformer: superjson,
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session || !ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in to access this resource",
		});
	}
	return next({
		ctx: {
			user: ctx.user,
			session: ctx.session,
		},
	});
});
