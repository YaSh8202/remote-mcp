import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { useCallback, useRef, useState } from "react";
import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
	PromptInput,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { AttachFileButton } from "@/components/chat/attach-file-button";
import { ServerSelectionBar } from "@/components/chat/server-selection-bar";
import { FreeTierProviders } from "@/components/free-tier-providers";
import { ModelSelector } from "@/components/model-selector";
import { useTRPC } from "@/integrations/trpc/react";
import { useChatStore } from "@/store/chat-store";
import { usePageHeader } from "@/store/header-store";
import { useNewChatStore } from "@/store/new-chat-store";
import { LLMProvider } from "@/types/models";

export const Route = createFileRoute("/_authed/chat/")({
	component: ChatPage,
});

const EXAMPLE_SUGGESTIONS = [
	"Help me debug this code",
	"Generate a SQL query",
	"Explain this concept",
	"Review my pull request",
];

function ChatPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();

	const createChatMutation = useMutation({
		...trpc.chat.create.mutationOptions(),
	});
	const addMcpServerMutation = useMutation({
		...trpc.chat.addMcpServer.mutationOptions(),
	});

	// State for add LLM key dialog
	const [addKeyDialogOpen, setAddKeyDialogOpen] = useState(false);
	const [selectedLLMProvider, setSelectedLLMProvider] = useState<LLMProvider>(
		LLMProvider.GITHUB_MODELS,
	);

	// New chat store for managing servers before chat creation
	const { selectedServerIds, clearServers, addServer, removeServer } =
		useNewChatStore();

	// Check if user has any LLM providers configured
	const { data: llmProviders } = useSuspenseQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);
	const hasProviders = llmProviders && llmProviders.length > 0;

	// Model selection state
	const { selectedModel, setSelectedModel } = useChatStore();

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

	// Handle new chat submission
	const handleNewChatSubmit = useCallback(
		async (input: PromptInputMessage) => {
			if (!input.text && !input.files?.length) return;

			// Convert PromptInput message to UIMessage format
			const parts: UIMessage["parts"] = [];

			// Add text part if present
			if (input.text) {
				parts.push({ type: "text", text: input.text });
			}

			// Add file parts if present (they're already in FileUIPart format)
			if (input.files && input.files.length > 0) {
				parts.push(...input.files);
			}

			const message: UIMessage = {
				id: nanoid(),
				role: "user",
				parts,
				metadata: { status: "pending" },
			};

			const chatTitle = input.text || "New Chat";
			const chatId = await createNewChatRef.current({ chatTitle, message });

			navigate({ to: `/chat/${chatId}` });
		},
		[navigate],
	);

	// Handle suggestion click
	const handleSuggestionClick = useCallback(
		async (suggestion: string) => {
			await handleNewChatSubmit({ text: suggestion, files: [] });
		},
		[handleNewChatSubmit],
	);

	usePageHeader({
		breadcrumbs: [
			{
				label: "Chat",
			},
		],
	});

	// Server management handlers (for new chat, we use the store)
	const handleServerAdd = useCallback(
		async (serverId: string) => {
			addServer(serverId);
		},
		[addServer],
	);

	const handleServerRemove = useCallback(
		async (serverId: string) => {
			removeServer(serverId);
		},
		[removeServer],
	);

	const handleProviderSelect = (provider: LLMProvider) => {
		setSelectedLLMProvider(provider);
		setAddKeyDialogOpen(true);
	};

	const existingProviders =
		llmProviders?.map((p) => p.provider as LLMProvider) || [];

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="flex-1 overflow-hidden">
				<Conversation className="h-full">
					<ConversationContent className="max-w-4xl mx-auto">
						{hasProviders ? (
							<ConversationEmptyState className="min-h-[60vh]">
								<div className="space-y-8 w-full max-w-2xl">
									{/* Welcome Section */}
									<div className="space-y-3 text-center">
										<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
											<svg
												className="w-8 h-8 text-primary"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<title>Chat Icon</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
												/>
											</svg>
										</div>
										<h1 className="text-3xl font-bold tracking-tight">
											Start a conversation
										</h1>
										<p className="text-muted-foreground text-lg">
											Ask questions, get help with code, or explore with AI
											assistants
										</p>
									</div>

									{/* Suggestions */}
									<div className="space-y-3">
										<p className="text-sm text-muted-foreground text-center">
											Try one of these:
										</p>
										<Suggestions className="justify-center">
											{EXAMPLE_SUGGESTIONS.map((suggestion) => (
												<Suggestion
													key={suggestion}
													suggestion={suggestion}
													onClick={handleSuggestionClick}
													className="bg-background hover:bg-accent transition-colors"
												/>
											))}
										</Suggestions>
									</div>

									{/* MCP Servers Info (if any selected) */}
									{selectedServerIds.length > 0 && (
										<div className="rounded-lg border border-border bg-muted/50 p-4">
											<p className="text-sm text-muted-foreground">
												<span className="font-medium text-foreground">
													{selectedServerIds.length}
												</span>{" "}
												MCP server{selectedServerIds.length > 1 ? "s" : ""}{" "}
												selected and ready to use
											</p>
										</div>
									)}
								</div>
							</ConversationEmptyState>
						) : (
							<div className="h-full flex flex-col">
								<div className="flex-1 overflow-y-auto">
									<FreeTierProviders onProviderSelect={handleProviderSelect} />
								</div>
							</div>
						)}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>
			</div>

			{/* Prompt Input */}
			<div className=" bg-background">
				<div className="max-w-4xl mx-auto p-4 space-y-3">
					{/* Server Selection Buttons */}
					{hasProviders && (
						<ServerSelectionBar
							selectedServerIds={selectedServerIds}
							onServerAdd={handleServerAdd}
							onServerRemove={handleServerRemove}
							onExternalServerAdd={async () => ({
								success: false,
								error: "External servers not supported in new chat",
							})}
						/>
					)}

					<PromptInput
						onSubmit={handleNewChatSubmit}
						globalDrop={hasProviders}
						className="shadow-lg"
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
								placeholder={
									hasProviders
										? "Start a new chat..."
										: "Please add an LLM API key to start chatting..."
								}
								className="min-h-[60px] resize-none"
								disabled={!hasProviders}
							/>
						</PromptInputBody>
						<PromptInputFooter className="flex items-center justify-between px-3 py-2">
							<div className="flex items-center gap-2">
								<AttachFileButton disabled={!hasProviders} />
								<ModelSelector
									selectedModel={selectedModel}
									onModelSelect={setSelectedModel}
									disabled={!hasProviders}
								/>
							</div>
							<PromptInputSubmit disabled={!hasProviders} />
						</PromptInputFooter>
					</PromptInput>
				</div>
			</div>

			<AddLLMKeyDialog
				open={addKeyDialogOpen}
				onOpenChange={setAddKeyDialogOpen}
				existingProviders={existingProviders}
				initialProvider={selectedLLMProvider}
			/>
		</div>
	);
}
