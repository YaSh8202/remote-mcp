import { Thread } from "@/components/assistant-ui/thread";
import { ChatRuntimeProvider } from "@/components/chat-runtime-provider";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/integrations/trpc/react";
import { dbMessageToUIMessage } from "@/lib/chat-utils";
import { usePageHeader } from "@/store/header-store";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/_authed/chat/$chatId")({
	loader: async ({ context, params }) => {
		const { chatId } = params;
		if (!chatId) {
			throw new Error("chatId is required");
		}
		try {
			await context.queryClient.ensureQueryData(
				context.trpc.chat.getWithMessages.queryOptions({
					chatId,
					messageLimit: 100,
				}),
			);
		} catch (e) {
			console.error("Error loading chat:", e);
			throw notFound();
		}
	},
	component: ChatPageWithId,

	notFoundComponent: () => {
		const navigate = useNavigate();

		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center max-w-lg mx-auto p-8 space-y-8">
				<div className="space-y-4 text-center">
					<div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
						<svg
							className="w-8 h-8 text-muted-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<div className="space-y-2">
						<h1 className="text-2xl font-semibold text-foreground">
							Chat Not Found
						</h1>
						<p className="text-sm text-muted-foreground max-w-md">
							The chat you are looking for does not exist or may have been
							deleted.
						</p>
					</div>
				</div>
				<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
					<Button
						onClick={() => navigate({ to: "/apps" })}
						className="min-w-[140px] gap-2"
					>
						New Chat
					</Button>
					<Button
						variant="outline"
						onClick={() => navigate({ to: "/" })}
						className="min-w-[140px]"
					>
						Go to Home
					</Button>
				</div>
			</div>
		);
	},
});

function ChatPageWithId() {
	const { chatId } = Route.useParams();

	const trpc = useTRPC();

	const { data } = useSuspenseQuery({
		enabled: chatId,
		...trpc.chat.getWithMessages.queryOptions({
			chatId: chatId,
		}),
	});

	const { chat, messages } = data ?? {};

	const uiMessages = useMemo(() => {
		if (!messages) return [];
		return messages.map(dbMessageToUIMessage);
	}, [messages]);
	console.log("🚀 ~ ChatIdPage ~ messages:", uiMessages);

	usePageHeader({
		breadcrumbs: [
			{
				label: "Chat",
				href: "/chat",
			},
			{
				label: chat.title ?? "New Chat",
			},
		],
	});

	return (
		<ChatRuntimeProvider chatId={chatId} messages={uiMessages}>
			<div className="flex h-full overflow-hidden">
				<div className="flex-1 h-full overflow-hidden">
					<Thread />
				</div>
			</div>
		</ChatRuntimeProvider>
	);
}
