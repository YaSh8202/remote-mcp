import { Route } from "@/routes/__root";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL:
		typeof window !== "undefined"
			? window.location.origin
			: "http://localhost:3000",
});

export const {
	signIn,
	signOut,
	signUp,
	useSession: useClientSession,
} = authClient;

// Custom useSession hook that uses server-side session data
export function useSession() {
	const loaderData = Route.useLoaderData();
	const serverSession = loaderData.session;

	const { data, isPending, ...rest } = useClientSession();

	const session = isPending ? serverSession : data;

	return {
		session,
		isPending,
		...rest,
	};
}
