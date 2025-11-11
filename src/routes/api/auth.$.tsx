import { createFileRoute } from "@tanstack/react-router";
import { auth } from "../../lib/auth";

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

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: authHandler,
			POST: authHandler,
		},
	},
});
