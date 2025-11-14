import { Skeleton } from "@/components/ui/skeleton";
import { useModels } from "@/hooks/use-models";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_authed/chat")({
	component: ChatLayout,
	head: () => ({
		meta: [
			{
				title: "Chat - Remote MCP",
			},
			{
				name: "description",
				content:
					"Chat with AI assistants powered by Remote MCP servers. Test your MCP integrations with Claude, GPT-4, and other AI models.",
			},
			{
				name: "robots",
				content: "noindex, nofollow",
			},
		],
		links: [
			{
				rel: "canonical",
				href: "https://remotemcp.tech/chat",
			},
		],
	}),
});

const ChatSkeleton = () => (
	<div className="flex h-full flex-col container max-w-2xl mx-auto pt-5">
		<div className="flex-1 space-y-4 p-4">
			{/* Chat header skeleton */}
			<div className="flex items-center gap-2">
				<Skeleton className="h-8 w-8 rounded-full" />
				<Skeleton className="h-6 w-32" />
			</div>

			{/* Message skeletons */}
			<div className="space-y-8 flex flex-col">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className={`flex gap-3 ${i % 2 === 0 ? "self-justify-start" : "self-justify-end"}`}
					>
						<Skeleton className="h-8 w-8 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					</div>
				))}
			</div>
		</div>

		{/* Input area skeleton */}
		<div className="border-t p-4">
			<div className="flex gap-2">
				<Skeleton className="h-10 flex-1" />
				<Skeleton className="h-10 w-10" />
			</div>
		</div>
	</div>
);

function ChatLayout() {
	useModels();
	return (
		<div className="absolute left-3 right-3 md:left-4 md:right-4 top-14 bottom-[env(safe-area-inset-bottom)] flex h-auto">
			<div className="flex-1 overflow-hidden">
				<Suspense fallback={<ChatSkeleton />}>
					<Outlet />
				</Suspense>
			</div>
		</div>
	);
}
