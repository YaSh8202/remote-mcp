import { createContext } from "@/integrations/trpc/init";
import { trpcRouter } from "@/integrations/trpc/router";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

async function handler({ request }: { request: Request }) {
	return fetchRequestHandler({
		req: request,
		router: trpcRouter,
		endpoint: "/api/trpc",
		createContext: async (opts) => {
			return createContext({
				...opts,
				req: request,
				res: undefined,
			});
		},
	});
}

export const ServerRoute = createServerFileRoute("/api/trpc/$").methods({
	GET: handler,
	POST: handler,
});
