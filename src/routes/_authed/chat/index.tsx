"use client";

import { useChat } from "@ai-sdk/react";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Plus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
	PromptInput,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { FreeTierProviders } from "@/components/free-tier-providers";
import { ModelSelector } from "@/components/model-selector";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useNewChatStore } from "@/store/new-chat-store";
import { LLMProvider } from "@/types/models";

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

	// State for model selection
	const [selectedModel, setSelectedModel] = useState<string>(
		"github-models:gpt-4o-mini",
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
		<div className="flex h-full overflow-hidden">
			<div className="flex-1 h-full overflow-hidden flex flex-col">
				{hasProviders ? (
					<>
						<Conversation className="flex-1">
							<ConversationContent>
								<ConversationEmptyState
									title="Start a new conversation"
									description="Send a message to begin chatting with AI"
								/>
							</ConversationContent>
						</Conversation>

						{/* Input area */}
						<div className="sticky bottom-0 mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 bg-background">
							<PromptInput
								accept="image/*"
								multiple
								onSubmit={async ({ text, files }) => {
									if (!text.trim() && files.length === 0) return;

									await chat.append({
										role: "user",
										parts: [
											...files.map((file) => ({
												type: "file" as const,
												url: file.url,
												mediaType: file.mediaType,
												filename: file.filename,
											})),
											...(text.trim()
												? [{ type: "text" as const, text: text.trim() }]
												: []),
										],
									});
								}}
								className="relative flex w-full flex-col rounded-3xl border border-border bg-muted shadow-sm"
							>
								<PromptInputBody>
									<PromptInputAttachments>
										{(attachment) => (
											<PromptInputAttachment
												key={attachment.id}
												data={attachment}
											/>
										)}
									</PromptInputAttachments>

									<PromptInputTextarea
										placeholder="Send a message..."
										className="mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-base outline-none placeholder:text-muted-foreground"
										rows={1}
										autoFocus
									/>

									<PromptInputFooter>
										<PromptInputTools>
											<ModelSelector
												selectedModel={selectedModel}
												onModelSelect={setSelectedModel}
											/>
										</PromptInputTools>

										<PromptInputSubmit status={chat.status} />
									</PromptInputFooter>
								</PromptInputBody>
							</PromptInput>
						</div>
					</>
				) : (
					<div className="max-w-4xl mx-auto flex flex-col h-full">
						<div className="flex-1 overflow-y-auto">
							<FreeTierProviders onProviderSelect={handleProviderSelect} />
						</div>
						<div className="sticky bottom-0 mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 bg-background">
							<div className="relative flex w-full flex-col rounded-3xl border border-border bg-muted px-1 pt-2 shadow-sm">
								<div className="mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-base outline-none placeholder:text-muted-foreground text-muted-foreground flex items-center">
									Please add an LLM API key to start chatting...
								</div>
								<div className="relative mx-1 mt-2 mb-2 flex items-center justify-between">
									<div className="flex items-center gap-0.5">
										<Button variant="ghost" size="icon-sm" disabled>
											<Plus className="size-4" />
										</Button>
									</div>
									<div className="flex items-center gap-2">
										<Button size="icon-sm" disabled>
											<svg
												className="size-4"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<title>Send</title>
												<path
													d="m5 12 7-7 7 7M12 5v14"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			<AddLLMKeyDialog
				open={addKeyDialogOpen}
				onOpenChange={setAddKeyDialogOpen}
				existingProviders={existingProviders}
				initialProvider={selectedProvider}
			/>
		</div>
	);
}
