import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
import { Thread } from "@/components/chat-ui/thread";
import { FreeTierProviders } from "@/components/free-tier-providers";
import { Button } from "@/components/ui/button";
import { ChatProvider } from "@/contexts/chat-context";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useNewChatStore } from "@/store/new-chat-store";
import { LLMProvider } from "@/types/models";
import type { Message } from "@ai-sdk/react";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { generateId } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";

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

	// Temporary chat ID for new chats
	const [tempChatId] = useState(() => `temp-${generateId()}`);
	const [messages, setMessages] = useState<Message[]>([]);
	const chatCreatedRef = useRef(false);

	// New chat store for managing servers before chat creation
	const { selectedServerIds, clearServers } = useNewChatStore();

	// Check if user has any LLM providers configured
	const { data: llmProviders } = useSuspenseQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);
	const hasProviders = llmProviders && llmProviders.length > 0;

	const createNewChat = useCallback(
		async (firstMessage: Message) => {
			if (chatCreatedRef.current) return;
			chatCreatedRef.current = true;

			const chatTitle =
				typeof firstMessage.content === "string"
					? firstMessage.content.slice(0, 100)
					: "New Chat";

			// Convert Message to UIMessage format for DB
			const dbMessage = {
				...firstMessage,
				metadata: { status: "pending" },
			};

			const chatData = await createChatMutation.mutateAsync({
				title: chatTitle,
				messages: [dbMessage],
			});

			// Persist selected MCP servers to the newly created chat
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
					clearServers();

					queryClient.invalidateQueries({
						queryKey: trpc.chat.listMcpServers.queryKey({
							chatId: chatData.id,
						}),
					});
				} catch (error) {
					console.error("Failed to add MCP servers to chat:", error);
				}
			}

			queryClient.refetchQueries({
				queryKey: trpc.chat.getWithMessages.queryKey(),
			});
			queryClient.refetchQueries({
				queryKey: trpc.chat.list.queryKey(),
			});

			navigate({ to: `/chat/${chatData.id}` });
		},
		[
			addMcpServerMutation,
			clearServers,
			createChatMutation,
			queryClient,
			selectedServerIds,
			navigate,
			trpc.chat.listMcpServers,
			trpc.chat.list,
			trpc.chat.getWithMessages,
		],
	);

	// Monitor messages and create chat when first message is sent
	useEffect(() => {
		if (messages.length > 0 && !chatCreatedRef.current) {
			const firstUserMessage = messages.find((m) => m.role === "user");
			if (firstUserMessage) {
				createNewChat(firstUserMessage);
			}
		}
	}, [messages, createNewChat]);

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

	if (!hasProviders) {
		return (
			<div className="flex h-full overflow-hidden">
				<div className="flex-1 h-full overflow-hidden">
					<div className="max-w-4xl mx-auto flex flex-col h-full">
						<div className="flex-1 overflow-y-auto">
							<FreeTierProviders onProviderSelect={handleProviderSelect} />
						</div>

						{/* Disabled input when no providers */}
						<div className="relative flex w-full flex-col rounded-3xl border border-border bg-muted px-1 pt-2 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),0_2px_5px_0px_rgba(0,0,0,0.06)] dark:border-muted-foreground/15 mb-4">
							<textarea
								placeholder="Please add an LLM API key to start chatting..."
								className="mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-base outline-none placeholder:text-muted-foreground"
								rows={1}
								disabled
							/>
							<div className="relative mx-1 mt-2 mb-2 flex items-center justify-end">
								<Button
									size="icon"
									className="size-[34px] rounded-full"
									disabled
								>
									<span className="sr-only">Send</span>
								</Button>
							</div>
						</div>
					</div>

					<AddLLMKeyDialog
						open={addKeyDialogOpen}
						onOpenChange={setAddKeyDialogOpen}
						existingProviders={existingProviders}
						initialProvider={selectedProvider}
					/>
				</div>
			</div>
		);
	}

	return (
		<ChatProvider chatId={tempChatId} initialMessages={messages}>
			<div className="flex h-full overflow-hidden">
				<div className="flex-1 h-full overflow-hidden">
					<Thread isNewChat={true} />
				</div>
			</div>
		</ChatProvider>
	);
}
