import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { ChatService } from "@/services/chat-service";

async function handler({ request }: { request: Request }) {
	const session = await auth.api.getSession({
		headers: request.headers,
	})

	if (!session?.user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		})
	}

	const url = new URL(request.url);
	const method = request.method;

	try {
		if (method === "GET") {
			// Get user chats
			const chats = await ChatService.getUserChats(session.user.id);
			return new Response(JSON.stringify({ chats }), {
				headers: { "Content-Type": "application/json" },
			})
		} else if (method === "POST") {
			// Create new chat
			const body = await request.json();
			const newChat = await ChatService.createChat(session.user.id, body);
			return new Response(JSON.stringify({ chat: newChat }), {
				headers: { "Content-Type": "application/json" },
			})
		}

		return new Response(JSON.stringify({ error: "Method not allowed" }), {
			status: 405,
			headers: { "Content-Type": "application/json" },
		})
	} catch (error) {
		console.error("Chat API error:", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		})
	}
}

export const ServerRoute = createServerFileRoute("/api/chats").methods({
	GET: handler,
	POST: handler,
});