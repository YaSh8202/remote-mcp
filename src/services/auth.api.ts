import { auth } from "@/lib/auth";
import { createMiddleware, createServerFn, json } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

export const getUserSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getWebRequest();

		if (!request?.headers) {
			return null;
		}

		const userSession = await auth.api.getSession({ headers: request.headers });

		return userSession;
	},
);

export const userMiddleware = createMiddleware().server(async ({ next }) => {
	const userSession = await getUserSession();

	return next({ context: { userSession } });
});

export const userRequiredMiddleware = createMiddleware()
	.middleware([userMiddleware])
	.server(async ({ next, context }) => {
		if (!context.userSession) {
			throw json(
				{ message: "You must be logged in to do that!" },
				{ status: 401 },
			);
		}

		return next({ context: { userSession: context.userSession } });
	});
