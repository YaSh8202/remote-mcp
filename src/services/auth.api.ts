import { createMiddleware, json } from "@tanstack/react-start";
import { getUserSession } from "@/lib/auth-server";

export const userMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const userSession = await getUserSession();

		return next({ context: { userSession } });
	},
);

export const userRequiredMiddleware = createMiddleware({ type: "function" })
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
