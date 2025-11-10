import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./auth";

export const getUserSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getRequest();

		if (!request?.headers) {
			return null;
		}

		const userSession = await auth.api.getSession({ headers: request.headers });

		return userSession;
	},
);
