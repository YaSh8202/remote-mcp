import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "../lib/auth";

async function authHandler({ request }: { request: Request }) {
	try {
		return await auth.handler(request);
	} catch (error) {
		console.error("Auth handler error:", error);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
	GET: authHandler,
	POST: authHandler,
});
