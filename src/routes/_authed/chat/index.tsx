import { Thread } from "@/components/assistant-ui/thread";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useChat } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";

export const Route = createFileRoute("/_authed/chat/")({
	component: ChatPage,
});

function ChatPage() {
	const trpc = useTRPC();
	const createChatMutation = useMutation({
		...trpc.chat.create.mutationOptions(),
	});
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();

	const chat = useChat({
		transport: new DefaultChatTransport({
			api: "/api/chat",
			prepareSendMessagesRequest: ({ id, messages }) => {
				const message = messages[messages.length - 1];
				return {
					body: {
						id,
						message,
					},
				};
			},
		}),
		onFinish: async (data) => {
			console.log("onFinish", data);
			if (data.messages.length === 0) return;

			const message = data.messages[0] as UIMessage<{
				status: string;
			}>;
			if (message.role !== "user") return;
			message.metadata = {
				status: "pending",
			};

			const chatData = await createChatMutation.mutateAsync({
				title: "New Chat",
				messages: [message],
			});
			queryClient.refetchQueries({
				queryKey: trpc.chat.getWithMessages.queryKey(),
			});
			queryClient.refetchQueries({
				queryKey: trpc.chat.list.queryKey(),
			});
			navigate({ to: `/chat/${chatData.id}` });
		},
	});

	const runtime = useAISDKRuntime(chat);

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
