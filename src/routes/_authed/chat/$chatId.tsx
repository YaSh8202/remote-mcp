import { useChat } from "@ai-sdk-tools/store";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { countTokens } from "gpt-tokenizer";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ChatInputArea } from "@/components/chat/chat-input-area";
import { MessageRenderer } from "@/components/chat/message-renderer";
import { Button } from "@/components/ui/button";
import type { Chat, ChatMcpServer, McpServer } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { dbMessageToUIMessage } from "@/lib/chat-utils";
import { useChatModel } from "@/store/chat-store";
import { usePageHeader } from "@/store/header-store";
import type { UIMessage } from "@/types/chat";

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
						onClick={() => navigate({ to: "/chat" })}
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

type ChatWithMcpServers = Chat & {
	mcpServers?: Array<{
		chatMcpServer: ChatMcpServer;
		mcpServerData: McpServer | null;
	}>;
};

function ChatPageWithId() {
	const { chatId } = Route.useParams();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const chatModel = useChatModel();

	const {
		data: { chat, messages: dbMessages },
	} = useSuspenseQuery({
		enabled: !!chatId,
		...trpc.chat.getWithMessages.queryOptions({
			chatId: chatId,
		}),
	});

	const uiMessages = useMemo(() => {
		if (!dbMessages) return [];
		return dbMessages.map(dbMessageToUIMessage);
	}, [dbMessages]);

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

	const { data: chatMcpServers = [] } = useSuspenseQuery({
		...trpc.chat.listMcpServers.queryOptions({
			chatId: chatId,
		}),
	});

	const currentChat: ChatWithMcpServers = useMemo(
		() => ({ ...chat, mcpServers: chatMcpServers }),
		[chat, chatMcpServers],
	);

	// Use useChat hook for message handling
	const {
		messages,
		sendMessage,
		status,
		regenerate,
		addToolApprovalResponse,
		setMessages,
	} = useChat<UIMessage>({
		id: chatId,
		transport: new DefaultChatTransport({
			prepareSendMessagesRequest: ({ messages, ...rest }) => {
				const lastMessage = messages[messages.length - 1];
				if (!lastMessage.metadata?.modelId) {
					throw new Error("Model ID not found in message metadata");
				}

				const [provider, model] = lastMessage.metadata.modelId.split(":");
				return {
					body: {
						message: messages[messages.length - 1],
						provider,
						model,
						...rest,
					},
				};
			},
			api: `/api/chat/${chatId}`,
		}),
		messages: uiMessages,

		// Auto-continue after all approvals are submitted
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,

		onFinish: async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			queryClient.invalidateQueries({
				queryKey: trpc.chat.getWithMessages.queryKey(),
			});
		},
		onError: (error) => {
			toast.error(`Error sending message: ${error.message}`);
		},
	});
	console.log("🚀 ~ ChatPageWithId ~ messages:", messages);

	// Handle first message with "pending" status
	const isFirstMessageSendRef = useRef(false);

	useEffect(() => {
		if (messages.length !== 1 || isFirstMessageSendRef.current) return;
		const message = messages[0] as UIMessage;
		if (message.role === "user" && message.metadata?.status === "pending") {
			sendMessage();
			isFirstMessageSendRef.current = true;
		}
	}, [messages, sendMessage]);

	useEffect(() => {
		setMessages(uiMessages);
	}, [uiMessages, setMessages]);

	// Handle message submission
	const handleSubmit = useCallback(
		async (input: PromptInputMessage) => {
			if (!input.text && !input.files?.length) return;

			if (!chatModel) {
				toast.error("Please select a model before sending a message.");
				return;
			}

			await sendMessage({
				text: input.text,
				files: input.files,
				metadata: {
					modelId: chatModel.fullId,
					cost: null,
					status: null,
					totalUsage: null,
					messageTokens: countTokens(input.text || ""),
				},
			});
		},
		[chatModel, sendMessage],
	);

	return (
		<div className="flex h-full flex-col overflow-hidden bg-background">
			<div className="flex-1 overflow-hidden">
				<Conversation className="h-full">
					<ConversationContent className="max-w-4xl mx-auto">
						{messages.length === 0 ? (
							<div className="flex-1 flex items-center justify-center min-h-[60vh]">
								<div className="text-center space-y-2">
									<h2 className="text-2xl font-semibold">Hello there!</h2>
									<p className="text-muted-foreground text-lg">
										How can I help you today?
									</p>
								</div>
							</div>
						) : (
							messages.map((message, messageIndex) => (
								<MessageRenderer
									key={message.id}
									message={message}
									isLastMessage={messageIndex === messages.length - 1}
									status={status}
									onRegenerate={() =>
										regenerate({
											messageId: message.id,
											body: {
												trigger: "regenerate-message",
											},
										})
									}
									onToolApproval={addToolApprovalResponse}
								/>
							))
						)}
						{status === "submitted" && (
							<div className="flex justify-center py-4">
								<Loader />
							</div>
						)}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>
			</div>

			{/* Input Area */}
			<ChatInputArea
				chatId={chatId}
				currentChatServers={currentChat.mcpServers}
				onSubmit={handleSubmit}
				status={status}
			/>
		</div>
	);
}
