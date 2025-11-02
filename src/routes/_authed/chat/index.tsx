import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
import {
	ComposerAddAttachment,
	ComposerAttachments,
} from "@/components/assistant-ui/attachment";
import { SendButton, Thread } from "@/components/assistant-ui/thread";
import { FreeTierProviders } from "@/components/free-tier-providers";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useNewChatStore } from "@/store/new-chat-store";
import { LLMProvider } from "@/types/models";
import { useChat } from "@ai-sdk/react";
import {
	AssistantRuntimeProvider,
	ComposerPrimitive,
} from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useRef, useState } from "react";

export const Route = createFileRoute("/_authed/chat/")({
	component: ChatPage,
});

function ChatPage() {
	const trpc = useTRPC();
	const createChatMutation = useMutation({
		...trpc.chat.create.mutationOptions(),
	});
	const addMcpServerMutation = useMutation({
		...trpc.chat.addMcpServer.mutationOptions(),
	});
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();

	// State for add LLM key dialog
	const [addKeyDialogOpen, setAddKeyDialogOpen] = useState(false);
	const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(
		LLMProvider.GITHUB_MODELS,
	);

	// New chat store for managing servers before chat creation
	const { selectedServerIds, clearServers } = useNewChatStore();

	// Check if user has any LLM providers configured
	const { data: llmProviders } = useSuspenseQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);
	const hasProviders = llmProviders && llmProviders.length > 0;

	// biome-ignore lint/correctness/useExhaustiveDependencies: trpc query keys are stable
	const createNewChat = useCallback(
		async ({
			chatTitle,
			message,
		}: {
			chatTitle: string;
			message: UIMessage;
		}) => {
			const chatData = await createChatMutation.mutateAsync({
				title: chatTitle,
				messages: [message],
			});

			// Persist selected MCP servers to the newly created chat
			console.log("🚀 ~ onFinish ~ selectedServerIds:", selectedServerIds);
			if (selectedServerIds.length > 0) {
				try {
					await Promise.all(
						selectedServerIds.map((serverId) =>
							addMcpServerMutation.mutateAsync({
								chatId: chatData.id,
								isRemoteMcp: true,
								mcpServerId: serverId,
								tools: [],
								includeAllTools: true,
							}),
						),
					);
					// Clear the store after successful persistence
					clearServers();

					// Invalidate MCP servers list for the new chat
					queryClient.invalidateQueries({
						queryKey: trpc.chat.listMcpServers.queryKey({
							chatId: chatData.id,
						}),
					});
				} catch (error) {
					console.error("Failed to add MCP servers to chat:", error);
					// Continue navigation even if server attachment fails
				}
			}

			queryClient.refetchQueries({
				queryKey: trpc.chat.getWithMessages.queryKey(),
			});
			queryClient.refetchQueries({
				queryKey: trpc.chat.list.queryKey(),
			});
			return chatData.id;
		},
		[
			addMcpServerMutation,
			clearServers,
			createChatMutation,
			queryClient,
			selectedServerIds,
			trpc.chat.listMcpServers.queryKey(),
			trpc.chat.list.queryKey(),
			trpc.chat.getWithMessages.queryKey(),
		],
	);

	const createNewChatRef = useRef(createNewChat);
	createNewChatRef.current = createNewChat;

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
			if (data.messages.length === 0) return;

			const message = data.messages[0] as UIMessage<{
				status: string;
			}>;
			if (message.role !== "user") return;

			// this is to handle the case where user creates a new chat and sends a message, and we need to create the chat first before sending the message to model
			// once chat/$chatId page is loaded, it will check for the first user messages with "pending" status and send them to model
			message.metadata = {
				status: "pending",
			};

			const chatTitle =
				message.parts[0].type === "text" ? message.parts[0].text : "New Chat";

			const chatId = await createNewChatRef.current({ chatTitle, message });

			navigate({ to: `/chat/${chatId}` });
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

	const handleProviderSelect = (provider: LLMProvider) => {
		setSelectedProvider(provider);
		setAddKeyDialogOpen(true);
	};

	const existingProviders =
		llmProviders?.map((p) => p.provider as LLMProvider) || [];

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="flex h-full overflow-hidden">
				<div className="flex-1 h-full overflow-hidden">
					{hasProviders ? (
						<Thread isNewChat={true} />
					) : (
						<div className="max-w-4xl mx-auto flex flex-col h-full">
							<div className="flex-1 overflow-y-auto">
								<FreeTierProviders onProviderSelect={handleProviderSelect} />
							</div>
							<ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col rounded-3xl border border-border bg-muted px-1 pt-2 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),0_2px_5px_0px_rgba(0,0,0,0.06)] dark:border-muted-foreground/15">
								<ComposerAttachments />
								<ComposerPrimitive.Input
									placeholder="Please add an LLM API key to start chatting..."
									className="aui-composer-input mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-base outline-none placeholder:text-muted-foreground focus:outline-primary"
									rows={1}
									autoFocus
									aria-label="Message input"
									disabled={true}
								/>
								<div className="aui-composer-action-wrapper relative mx-1 mt-2 mb-2 flex items-center justify-between">
									<div className="flex items-center gap-0.5">
										<ComposerAddAttachment disabled />
									</div>
									<div className="flex items-center gap-2">
										<SendButton disabled={true} />
									</div>
								</div>
							</ComposerPrimitive.Root>
						</div>
					)}
				</div>
			</div>

			<AddLLMKeyDialog
				open={addKeyDialogOpen}
				onOpenChange={setAddKeyDialogOpen}
				existingProviders={existingProviders}
				initialProvider={selectedProvider}
			/>
		</AssistantRuntimeProvider>
	);
}
