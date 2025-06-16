import { getWebRequest } from "@tanstack/react-start/server";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { auth } from "../../lib/auth";

const t = initTRPC.create({
	transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ next }) => {
	const request = getWebRequest();

	if (!request?.headers) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "No request headers found",
		});
	}

	const userSession = await auth.api.getSession({ headers: request.headers });

	if (!userSession || !userSession.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in to access this resource",
		});
	}

	return next({
		ctx: {
			user: userSession.user,
			session: userSession.session,
		},
	});
});
