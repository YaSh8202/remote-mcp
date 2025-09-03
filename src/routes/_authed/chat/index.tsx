import { createFileRoute } from "@tanstack/react-router";

import { Thread } from "@/components/assistant-ui/thread";
import { usePageHeader } from "@/store/header-store";

export const Route = createFileRoute("/_authed/chat/")({
	component: ChatPage,
});

function ChatPage() {
	usePageHeader({
		breadcrumbs: [
			{
				label: "Chat",
			},
		],
	});

	return (
		<div className="flex h-full overflow-hidden">
			<div className="flex-1 h-full overflow-hidden">
				<Thread />
			</div>
		</div>
	);
}
