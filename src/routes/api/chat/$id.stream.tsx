import { createFileRoute } from "@tanstack/react-router";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { auth } from "@/lib/auth";
import { getActiveStreamId } from "@/services/chat-service";
import { getResumableStreamContext } from "./-libs/resumable-stream";

/**
 * Resumes an in-flight chat generation for a reconnecting client.
 *
 * The AI SDK's `useChat({ resume: true })` calls this endpoint (via
 * `transport.reconnectToStream`) on mount. We look up the chat's active stream id
 * and, if the producer is still running, replay the buffered SSE chunks and then
 * stream the rest live. A 204 tells the client there is nothing to resume.
 */
export const Route = createFileRoute("/api/chat/$id/stream")({
	server: {
		handlers: {
			GET: async ({ request, params }) => {
				try {
					const session = await auth.api.getSession({
						headers: request.headers,
					});
					if (!session?.user) {
						return new Response(JSON.stringify({ error: "Unauthorized" }), {
							status: 401,
							headers: { "Content-Type": "application/json" },
						});
					}

					const chatId = params.id;
					const activeStreamId = await getActiveStreamId(
						chatId,
						session.user.id,
					);

					// No in-flight stream → nothing to resume.
					if (!activeStreamId) {
						return new Response(null, { status: 204 });
					}

					const context = getResumableStreamContext();
					const resumableStream =
						await context.resumeExistingStream(activeStreamId);

					// `undefined` = unknown stream, `null` = already finished.
					if (!resumableStream) {
						return new Response(null, { status: 204 });
					}

					return new Response(
						resumableStream.pipeThrough(new TextEncoderStream()),
						{ headers: UI_MESSAGE_STREAM_HEADERS },
					);
				} catch (error) {
					console.error("Chat resume API Error:", error);
					return new Response(
						JSON.stringify({ error: "Failed to resume chat stream." }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});
