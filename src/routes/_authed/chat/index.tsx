import { createFileRoute } from "@tanstack/react-router";

import { ChatSidebar } from "@/components/chat-sidebar";

export const Route = createFileRoute("/_authed/chat/")({
	component: ChatIndexPage,
});

function ChatIndexPage() {
	return (
		<div className="flex h-full">
			<ChatSidebar />
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center text-muted-foreground">
					<h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
					<p className="text-sm">Select a conversation or start a new one to begin chatting</p>
				</div>
			</div>
		</div>
	);
}