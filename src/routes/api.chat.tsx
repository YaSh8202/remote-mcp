import { auth } from "@/lib/auth";
import { generateMessageId } from "@/lib/chat-utils";
import {
	createChat,
	getUserChats,
	loadChat,
	saveChat,
} from "@/services/chat-service";
import { openai } from "@ai-sdk/openai";
import { redirect } from "@tanstack/react-router";
import { createServerFileRoute } from "@tanstack/react-start/server";
import {
	type UIMessage,
	convertToModelMessages,
	streamText,
	validateUIMessages,
} from "ai";

async function chatHandler({ request }: { request: Request }) {
	try {
		// Get authenticated user
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body = await request.json();

		// Default: Handle chat streaming
		const {
			messages,
			system,
			chatId: requestChatId,
		}: {
			messages: UIMessage[];
			system?: string;
			chatId?: string;
		} = body;

		// Validate that we have an OpenAI API key
		if (!process.env.OPENAI_API_KEY) {
			return new Response(
				JSON.stringify({
					error:
						"OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Get or create chat ID
		let currentChatId = requestChatId;

		// If no chat ID provided, create new chat
		if (!requestChatId) {
			currentChatId = await createChat(session.user.id);
			if (!requestChatId)
				throw redirect({
					to: "/chat/$chatId",
					params: { chatId: currentChatId },
				});
		}

		// If we have a chat ID but only one message, we need to load existing messages
		// and append the new one (this handles the prepareSendMessagesRequest pattern)
		let allMessages = messages;
		if (requestChatId && messages.length === 1) {
			try {
				const existingMessages = await loadChat(requestChatId, session.user.id);
				allMessages = [...existingMessages, ...messages];
				allMessages = await validateUIMessages({
					messages: allMessages,
				});
			} catch (error) {
				console.error("Failed to load existing chat:", error);
				// Continue with just the new message if loading fails
			}
		}

		// Ensure we have a valid chat ID
		if (!currentChatId) {
			throw new Error("Failed to get or create chat ID");
		}

		saveChat({
			chatId: currentChatId,
			userId: session.user.id,
			messages: allMessages,
		});

		// Convert UI messages to model messages format (AI SDK v5)
		const modelMessages = convertToModelMessages(allMessages);

		// Use OpenAI with streaming
		const result = streamText({
			model: openai("gpt-4.1-mini"),
			system,
			messages: modelMessages,
			temperature: 0.7,
		});

		result.consumeStream();

		// Return the UI message stream response (AI SDK v5)
		return result.toUIMessageStreamResponse({
			headers: {
				"X-Chat-ID": currentChatId, // Include chat ID for frontend navigation
			},
			onFinish: async ({ messages }) => {
				await saveChat({
					chatId: currentChatId,
					messages: messages,
					userId: session.user.id,
				});
			},
			generateMessageId,
		});
	} catch (error) {
		console.error("Chat API Error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to process chat request. Please try again.",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

async function getChatHandler({ request }: { request: Request }) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const url = new URL(request.url);
		const chatId = url.searchParams.get("chatId");

		if (chatId) {
			// Load specific chat
			const messages = await loadChat(chatId, session.user.id);
			return new Response(JSON.stringify({ messages, chatId }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}

		// List all chats
		const chats = await getUserChats(session.user.id, { limit: 50 });
		return new Response(JSON.stringify({ chats }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Get chat error:", error);
		return new Response(JSON.stringify({ error: "Failed to load chat" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export const ServerRoute = createServerFileRoute("/api/chat").methods({
	POST: chatHandler,
	GET: getChatHandler,
});
