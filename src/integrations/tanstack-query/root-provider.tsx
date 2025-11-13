import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchStreamLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { TRPCProvider } from "@/integrations/trpc/react";

import { env } from "@/env";
import type { TRPCRouter } from "@/integrations/trpc/router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

function getUrl() {
	const base = (() => {
		if (typeof window !== "undefined") return "";

		if (env.BETTER_AUTH_URL) {
			return env.BETTER_AUTH_URL;
		}

		// For Vercel deployment, use VERCEL_URL
		if (process.env.VERCEL_URL) {
			return `https://${process.env.VERCEL_URL}`;
		}

		// For other cloud deployments, use SERVER_URL if available
		if (process.env.SERVER_URL) {
			return process.env.SERVER_URL;
		}

		// Fallback to localhost for local development
		return `http://localhost:${process.env.PORT ?? 3000}`;
	})();
	return `${base}/api/trpc`;
}

const headers = createIsomorphicFn()
	.client(() => ({}))
	.server(() => Object.fromEntries(getRequestHeaders().entries()));

export const trpcClient = createTRPCClient<TRPCRouter>({
	links: [
		httpBatchStreamLink({
			transformer: superjson,
			url: getUrl(),
			headers,
		}),
	],
});

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			dehydrate: { serializeData: superjson.serialize },
			hydrate: { deserializeData: superjson.deserialize },
		},
	});

	const serverHelpers = createTRPCOptionsProxy({
		client: trpcClient,
		queryClient: queryClient,
	});
	return {
		queryClient,
		trpc: serverHelpers,
	};
}

export function Provider({
	children,
	queryClient,
}: {
	children: React.ReactNode;
	queryClient: QueryClient;
}) {
	return (
		<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
			{children}
		</TRPCProvider>
	);
}
