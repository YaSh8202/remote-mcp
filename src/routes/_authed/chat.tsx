import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/chat")({
	component: ChatLayout,
});

function ChatLayout() {
	return (
		<div className="absolute left-3 right-3 md:left-4 md:right-4 top-14 bottom-[env(safe-area-inset-bottom)] flex h-auto">
			<div className="flex-1 overflow-hidden">
				<Outlet />
			</div>
		</div>
	);
}
