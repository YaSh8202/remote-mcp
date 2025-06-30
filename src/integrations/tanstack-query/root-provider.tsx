import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchStreamLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { TRPCProvider } from "@/integrations/trpc/react";

import type { TRPCRouter } from "@/integrations/trpc/router";
import { createIsomorphicFn, createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

function getUrl() {
	const base = (() => {
		if (typeof window !== "undefined") return "";
		return `http://localhost:${process.env.PORT ?? 3000}`;
	})();
	return `${base}/api/trpc`;
}

const getRequestHeaders = createServerFn({ method: "GET" }).handler(
	async () => {
		const request = getWebRequest();

		if (!request) {
			return {};
		}

		const headers = new Headers(request.headers);

		return Object.fromEntries(headers);
	},
);

const headers = createIsomorphicFn()
	.client(() => ({}))
	.server(() => getRequestHeaders());

export const trpcClient = createTRPCClient<TRPCRouter>({
	links: [
		httpBatchStreamLink({
			transformer: superjson,
			url: getUrl(),
			headers,
		}),
	],
});

const queryClient = new QueryClient({
	defaultOptions: {
		dehydrate: { serializeData: superjson.serialize },
		hydrate: { deserializeData: superjson.deserialize },
		queries: {
			refetchOnWindowFocus: false,
		},
	},
});

const serverHelpers = createTRPCOptionsProxy({
	client: trpcClient,
	queryClient: queryClient,
});

export function getContext() {
	return {
		queryClient,
		trpc: serverHelpers,
	};
}

export function Provider({ children }: { children: React.ReactNode }) {
	return (
		<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
			{children}
		</TRPCProvider>
	);
}
