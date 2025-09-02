import { openai } from "@ai-sdk/openai";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { type UIMessage, convertToModelMessages, streamText } from "ai";

async function handler({ request }: { request: Request }) {
	try {
		const {
			messages,
			system,
		}: {
			messages: UIMessage[];
			system?: string;
		} = await request.json();

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

		// Convert UI messages to model messages format (AI SDK v5)
		const modelMessages = convertToModelMessages(messages);

		// Use OpenAI with streaming
		const result = streamText({
			model: openai("gpt-4.1-mini"),
			system,
			messages: modelMessages,
			temperature: 0.7,
		});

		// Return the UI message stream response (AI SDK v5)
		return result.toUIMessageStreamResponse();
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

export const ServerRoute = createServerFileRoute("/api/chat").methods({
	POST: handler,
});
