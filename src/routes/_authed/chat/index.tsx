import { Thread } from "@/components/assistant-ui/thread";
import { usePageHeader } from "@/store/header-store";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { createFileRoute } from "@tanstack/react-router";
import { nanoid } from "nanoid";

export const Route = createFileRoute("/_authed/chat/")({
	component: ChatPage,
});

function ChatPage() {
	const runtime = useChatRuntime({
		transport: new AssistantChatTransport({
			api: "/api/chat",
		}),
		onFinish: async (data) => {
			console.log("Finished:", data);
		},
		generateId: () => nanoid(),
	});

	usePageHeader({
		breadcrumbs: [
			{
				label: "Chat",
			},
		],
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="flex h-full overflow-hidden">
				<div className="flex-1 h-full overflow-hidden">
					<Thread />
				</div>
			</div>
		</AssistantRuntimeProvider>
	);
}
