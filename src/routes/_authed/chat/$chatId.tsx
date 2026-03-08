import { useChat } from "@ai-sdk-tools/store";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import {
	DefaultChatTransport,
	lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { countTokens } from "gpt-tokenizer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
	type BranchSelectionByParentKey,
	deriveVisiblePath,
	ensureParentIds,
	getParentId,
	getSiblingsForMessage,
	mergeMessagesById,
	parentKeyFromParentId,
	ROOT_PARENT_ID,
	withBranchingMetadata,
} from "@/lib/chat-branching";
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
	component: ChatPageWithIdWrapper,

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

// LocalStorage helpers for branch selection persistence
function loadBranchSelection(chatId: string): BranchSelectionByParentKey {
	try {
		const stored = localStorage.getItem(`branch-selection:${chatId}`);
		return stored ? JSON.parse(stored) : {};
	} catch {
		return {};
	}
}

function saveBranchSelection(
	chatId: string,
	selection: BranchSelectionByParentKey,
) {
	try {
		localStorage.setItem(
			`branch-selection:${chatId}`,
			JSON.stringify(selection),
		);
	} catch {
		// Ignore storage errors
	}
}

// Force remount on chatId change so all state (historicalMessages, useChat, branchSelection) resets
function ChatPageWithIdWrapper() {
	const { chatId } = Route.useParams();
	return <ChatPageWithId key={chatId} />;
}

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

	// All messages from DB (full tree including all branches)
	const allDbMessages = useMemo(() => {
		if (!dbMessages) return [];
		return ensureParentIds(dbMessages.map(dbMessageToUIMessage));
	}, [dbMessages]);
	console.log("🚀 ~ ChatPageWithId ~ allDbMessages:", allDbMessages);

	// Layer 1: historicalMessages — client-side superset, never shrinks, optimistic inserts
	const [historicalMessages, setHistoricalMessages] = useState<UIMessage[]>(
		() => allDbMessages,
	);

	// Sync DB → historicalMessages on same-chat refetch (merge preserves optimistic inserts).
	// Cross-chat reset is handled by key={chatId} remount in the wrapper.
	const prevDbMessagesRef = useRef(allDbMessages);
	if (prevDbMessagesRef.current !== allDbMessages) {
		prevDbMessagesRef.current = allDbMessages;
		setHistoricalMessages((prev) => mergeMessagesById(prev, allDbMessages));
	}

	// Branch selection state (persisted to localStorage)
	const [branchSelection, setBranchSelection] =
		useState<BranchSelectionByParentKey>(() => loadBranchSelection(chatId));

	// Persist branch selection changes
	const updateBranchSelection = useCallback(
		(
			updater: (prev: BranchSelectionByParentKey) => BranchSelectionByParentKey,
		) => {
			setBranchSelection((prev) => {
				const next = updater(prev);
				saveBranchSelection(chatId, next);
				return next;
			});
		},
		[chatId],
	);

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

	// Ref to track the parentId to send with the next message
	const nextParentIdRef = useRef<string | null>(null);

	// Use useChat hook for message handling
	const {
		messages: liveMessages,
		sendMessage,
		status,
		regenerate,
		addToolApprovalResponse,
		setMessages,
	} = useChat<UIMessage>({
		id: chatId,
		transport: new DefaultChatTransport({
			prepareSendMessagesRequest: ({ messages, body, trigger, ...rest }) => {
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
						trigger,
						parentId: nextParentIdRef.current,
						...body,
						...rest,
					},
				};
			},
			api: `/api/chat/${chatId}`,
		}),
		messages: allDbMessages,

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

	// Layer 2: Normalize live messages — streaming assistant messages arrive WITHOUT
	// metadata.parentId, so infer it from linear order to prevent broken tree grouping.
	const normalizedLiveMessages = useMemo(() => {
		const out: UIMessage[] = [];
		for (let i = 0; i < liveMessages.length; i++) {
			const m = liveMessages[i];
			if (!m) continue;
			const hasParent = getParentId(m) !== undefined;
			if (hasParent) {
				out.push(m);
				continue;
			}
			const inferredParentId: string | null =
				i === 0 ? ROOT_PARENT_ID : (liveMessages[i - 1]?.id ?? ROOT_PARENT_ID);
			out.push(withBranchingMetadata(m, { parentId: inferredParentId }));
		}
		return out;
	}, [liveMessages]);

	// Layer 3: Merge historical (full tree) + normalized live (streaming) messages
	const allMessages = useMemo(
		() => mergeMessagesById(historicalMessages, normalizedLiveMessages),
		[historicalMessages, normalizedLiveMessages],
	);

	// Derive visible path from full merged tree + branch selection
	const visibleMessages = useMemo(
		() => deriveVisiblePath(allMessages, branchSelection),
		[allMessages, branchSelection],
	);

	// After DB refetch, sync useChat buffer so liveMessages picks up persisted
	// metadata (modelId, cost) instead of the stale streaming version overriding it.
	// Only fires when DB data actually changes (not on every visibleMessages recalc).
	const prevSyncRef = useRef(allDbMessages);
	useEffect(() => {
		if (prevSyncRef.current === allDbMessages) return;
		prevSyncRef.current = allDbMessages;
		if (status === "ready") {
			setMessages(
				deriveVisiblePath(
					mergeMessagesById(allDbMessages, normalizedLiveMessages),
					branchSelection,
				),
			);
		}
	}, [
		allDbMessages,
		status,
		normalizedLiveMessages,
		branchSelection,
		setMessages,
	]);

	// Handle first message with "pending" status
	const isFirstMessageSendRef = useRef(false);

	useEffect(() => {
		if (liveMessages.length !== 1 || isFirstMessageSendRef.current) return;
		const message = liveMessages[0] as UIMessage;
		if (message.role === "user" && message.metadata?.status === "pending") {
			// Set parentId to null for the first message
			nextParentIdRef.current = null;
			sendMessage();
			isFirstMessageSendRef.current = true;
		}
	}, [liveMessages, sendMessage]);

	// Handle message submission — optimistic insert before sending
	const handleSubmit = useCallback(
		async (input: PromptInputMessage) => {
			if (!input.text && !input.files?.length) return;

			if (!chatModel) {
				toast.error("Please select a model before sending a message.");
				return;
			}

			// The parentId for a new message is the last visible assistant message
			const lastVisibleMessage = visibleMessages[visibleMessages.length - 1];
			const parentId = lastVisibleMessage?.id ?? null;
			nextParentIdRef.current = parentId;

			// Optimistically select the newest branch
			updateBranchSelection((prev) => ({
				...prev,
				[parentKeyFromParentId(parentId)]: 1_000_000_000,
			}));

			// Align useChat buffer with visible branch before sending
			setMessages(visibleMessages);

			await sendMessage({
				text: input.text,
				files: input.files,
				metadata: {
					modelId: chatModel.fullId,
					cost: null,
					status: null,
					totalUsage: null,
					messageTokens: countTokens(input.text || ""),
					parentId,
				},
			});
		},
		[
			chatModel,
			sendMessage,
			visibleMessages,
			setMessages,
			updateBranchSelection,
		],
	);

	// Handle regeneration (creates sibling assistant response) — optimistic branch selection
	const handleRegenerate = useCallback(
		(message: UIMessage) => {
			const assistantParentId = message.metadata?.parentId;

			if (message.role === "assistant" && assistantParentId) {
				nextParentIdRef.current = assistantParentId;

				// Select the newest branch (the one about to be created)
				updateBranchSelection((prev) => ({
					...prev,
					[assistantParentId]: 1_000_000_000,
				}));

				// Align useChat buffer with visible branch before regenerating
				setMessages(visibleMessages);

				regenerate({
					messageId: assistantParentId,
					body: {
						trigger: "regenerate-message",
					},
				});
			}
		},
		[regenerate, updateBranchSelection, setMessages, visibleMessages],
	);

	// Handle branch navigation
	const handleBranchChange = useCallback(
		(parentKey: string, newIndex: number) => {
			updateBranchSelection((prev) => ({
				...prev,
				[parentKey]: newIndex,
			}));
		},
		[updateBranchSelection],
	);

	// Handle editing a user message (creates new branch) — optimistic insert
	const handleEditUserMessage = useCallback(
		async (messageToEdit: UIMessage, newText: string) => {
			if (!chatModel) {
				toast.error("Please select a model before sending a message.");
				return;
			}

			// The new message shares the same parent as the original
			const parentId = messageToEdit.metadata?.parentId ?? null;
			const parentKey = parentKeyFromParentId(parentId);

			// Set parentId for the request
			nextParentIdRef.current = parentId;

			// Compute next state synchronously for instant UI update
			const nextSelection: BranchSelectionByParentKey = {
				...branchSelection,
				[parentKey]: 1_000_000_000,
			};
			setBranchSelection(nextSelection);
			saveBranchSelection(chatId, nextSelection);

			// Align useChat buffer with visible branch before sending
			const nextVisible = deriveVisiblePath(allMessages, nextSelection);
			setMessages(nextVisible);

			await sendMessage({
				text: newText,
				metadata: {
					modelId: chatModel.fullId,
					cost: null,
					status: null,
					totalUsage: null,
					messageTokens: countTokens(newText),
					parentId,
					editedFromId: messageToEdit.id,
				},
			});
		},
		[chatModel, sendMessage, branchSelection, allMessages, chatId, setMessages],
	);

	return (
		<div className="flex h-full flex-col overflow-hidden bg-background">
			<div className="flex-1 overflow-hidden">
				<Conversation className="h-full">
					<ConversationContent className="max-w-4xl mx-auto">
						{visibleMessages.length === 0 ? (
							<div className="flex-1 flex items-center justify-center min-h-[60vh]">
								<div className="text-center space-y-2">
									<h2 className="text-2xl font-semibold">Hello there!</h2>
									<p className="text-muted-foreground text-lg">
										How can I help you today?
									</p>
								</div>
							</div>
						) : (
							visibleMessages.map((message, messageIndex) => {
								const {
									parentKey,
									siblings,
									index: siblingIndex,
								} = getSiblingsForMessage(allMessages, message);

								return (
									<MessageRenderer
										key={message.id}
										message={message}
										isLastMessage={messageIndex === visibleMessages.length - 1}
										status={status}
										onRegenerate={() => handleRegenerate(message)}
										onToolApproval={addToolApprovalResponse}
										siblingCount={siblings.length}
										siblingIndex={siblingIndex}
										onBranchChange={(newIndex: number) =>
											handleBranchChange(parentKey, newIndex)
										}
										onEditUserMessage={
											message.role === "user"
												? (newText: string) =>
														handleEditUserMessage(message, newText)
												: undefined
										}
									/>
								);
							})
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
