import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { createFileRoute } from "@tanstack/react-router";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";

export const Route = createFileRoute("/_authed/chat")({
	component: ChatPage,
});

function ChatPage() {
	// Using AI SDK v5 with useChatRuntime hook and custom transport
	const runtime = useChatRuntime({
		transport: new AssistantChatTransport({
			api: "/api/chat",
		}),
	});

	return (
		<div className="flex h-full">
			<AssistantRuntimeProvider runtime={runtime}>
				<div className="w-80 border-r bg-muted/30">
					<div className="p-4">
						<h2 className="text-lg font-semibold mb-4">Conversations</h2>
						{/* <AssistantRuntimeProvider runtime={runtime}> */}
						<ThreadList />
						{/* </AssistantRuntimeProvider> */}
					</div>
				</div>
				<div className="flex-1">
					<Thread />
				</div>
			</AssistantRuntimeProvider>
		</div>
	);
}
