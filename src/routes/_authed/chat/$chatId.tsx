"use client";

import { useChat } from "@ai-sdk/react";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import type { ReasoningUIPart, ToolUIPart, UIMessage } from "ai";
import {
	ChevronDown,
	CopyIcon,
	KeyIcon,
	Plus,
	RefreshCwIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageAction,
	MessageActions,
	MessageAttachment,
	MessageAttachments,
	MessageContent,
	MessageResponse,
	MessageToolbar,
} from "@/components/ai-elements/message";
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
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "@/components/ai-elements/tool";
import { ExternalServerDetailsPopover } from "@/components/external-server-details-popover";
import { MCPIcon } from "@/components/icons";
import { ModelSelector } from "@/components/model-selector";
import { ServerDetailsPopover } from "@/components/server-details-popover";
import { ServerSelectionPopover } from "@/components/server-selection-popover";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/integrations/trpc/react";
import { dbMessageToUIMessage } from "@/lib/chat-utils";
import { useChatStore } from "@/store/chat-store";
import { usePageHeader } from "@/store/header-store";

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
	const queryClient = useQueryClient();
	const { selectedModel, selectedProvider, setSelectedModel } = useChatStore();
	const [showAddKeyDialog, setShowAddKeyDialog] = useState(false);

	const { data } = useSuspenseQuery({
		enabled: !!chatId,
		...trpc.chat.getWithMessages.queryOptions({
			chatId: chatId,
		}),
	});

	const { chat, messages: dbMessages } = data ?? {};

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

	const { data: keys = [] } = useSuspenseQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);

	const { data: servers = [] } = useSuspenseQuery(
		trpc.mcpServer.list.queryOptions(),
	);

	const { data: availableApps } = useSuspenseQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	const validKeys = keys.filter((key) => key.isValid === true);
	const hasValidKeys = validKeys.length > 0;
	const existingProviders = validKeys.map((key) => key.provider);

	// Get selected servers (remote MCP servers)
	const [localSelectedServerIds, setLocalSelectedServerIds] = useState<
		string[]
	>([]);

	useEffect(() => {
		const serverIds = chatMcpServers
			.filter(
				(
					server,
				): server is typeof server & {
					mcpServerData: NonNullable<typeof server.mcpServerData>;
				} => server.chatMcpServer.isRemoteMcp && server.mcpServerData !== null,
			)
			.map((server) => server.mcpServerData.id);
		setLocalSelectedServerIds(serverIds);
	}, [chatMcpServers]);

	const selectedServers = servers.filter((server) =>
		localSelectedServerIds.includes(server.id),
	);

	const externalServers = chatMcpServers.filter(
		(server) => !server.chatMcpServer.isRemoteMcp,
	);

	// Mutations for MCP server management
	const addMcpServerMutation = useMutation({
		...trpc.chat.addMcpServer.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.chat.listMcpServers.queryKey({
					chatId: chatId,
				}),
			});
		},
	});

	const removeMcpServerMutation = useMutation({
		...trpc.chat.removeMcpServer.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.chat.listMcpServers.queryKey({
					chatId: chatId,
				}),
			});
		},
	});

	const validateExternalServerMutation = useMutation({
		...trpc.mcpServer.validateExternal.mutationOptions(),
	});

	const handleServerAdd = async (serverId: string) => {
		const newServerIds = [...localSelectedServerIds, serverId];
		setLocalSelectedServerIds(newServerIds);

		try {
			await addMcpServerMutation.mutateAsync({
				chatId: chatId,
				isRemoteMcp: true,
				mcpServerId: serverId,
				includeAllTools: true,
				tools: [],
			});
		} catch (error) {
			console.error("Failed to add MCP server to chat:", error);
		}
	};

	const handleServerRemove = async (serverId: string) => {
		const newServerIds = localSelectedServerIds.filter((id) => id !== serverId);
		setLocalSelectedServerIds(newServerIds);

		try {
			const chatMcpServer = chatMcpServers.find(
				(
					server,
				): server is typeof server & {
					mcpServerData: NonNullable<typeof server.mcpServerData>;
				} => server.mcpServerData?.id === serverId,
			);
			if (chatMcpServer) {
				await removeMcpServerMutation.mutateAsync({
					id: chatMcpServer.chatMcpServer.id,
				});
			}
		} catch (error) {
			console.error("Failed to remove MCP server from chat:", error);
		}
	};

	const handleExternalServerRemove = async (chatMcpServerId: string) => {
		try {
			await removeMcpServerMutation.mutateAsync({
				id: chatMcpServerId,
			});
		} catch (error) {
			console.error("Failed to remove external MCP server from chat:", error);
		}
	};

	const handleExternalServerAdd = async (config: {
		displayName: string;
		url: string;
		type: "http" | "sse";
		headers?: Record<string, string>;
	}): Promise<{ success: boolean; error?: string }> => {
		try {
			const validateResult = await validateExternalServerMutation.mutateAsync({
				url: config.url,
				headers: config.headers,
			});

			if (!validateResult.isValid) {
				return {
					success: false,
					error:
						validateResult.error ||
						"Failed to connect to the MCP server. Please check the URL and try again.",
				};
			}

			await addMcpServerMutation.mutateAsync({
				chatId: chatId,
				isRemoteMcp: false,
				displayName: config.displayName,
				config: {
					url: config.url,
					type: config.type,
					headers: config.headers,
				},
				includeAllTools: true,
				tools: [],
			});

			return { success: true };
		} catch (error) {
			console.error("Failed to add external MCP server to chat:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "An unexpected error occurred. Please try again.",
			};
		}
	};

	// Set up useChat hook
	const { messages, append, reload, isLoading, status } = useChat({
		id: chatId,
		api: `/api/chat/${chatId}`,
		initialMessages: uiMessages,
		body: {
			provider: selectedProvider,
			model: selectedModel,
		},
		onFinish: () => {
			// Invalidate chat queries to refresh the data
			queryClient.invalidateQueries({
				queryKey: trpc.chat.getWithMessages.queryKey({ chatId }),
			});
		},
	});

	// Copy message text to clipboard
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch (error) {
			console.error("Failed to copy text:", error);
		}
	};

	// Regenerate a message
	const handleRegenerate = (messageId: string) => {
		const messageIndex = messages.findIndex((m) => m.id === messageId);
		if (messageIndex === -1) return;

		const userMessage = messages[messageIndex - 1];
		if (!userMessage || userMessage.role !== "user") return;

		// Reload from the user message
		reload({
			body: {
				provider: selectedProvider,
				model: selectedModel,
				trigger: "regenerate-message",
				message: userMessage,
			},
		});
	};

	// Extract text from message parts
	const getMessageText = (msg: UIMessage): string => {
		return msg.parts
			.filter((part) => part.type === "text")
			.map((part) => part.text || "")
			.join(" ")
			.trim();
	};

	return (
		<div className="flex h-full overflow-hidden flex-col">
			<Conversation className="flex-1">
				<ConversationContent>
					{messages.length === 0 ? (
						<ConversationEmptyState
							title="Start a conversation"
							description="Send a message to begin chatting with AI"
						/>
					) : (
						messages.map((message, index) => (
							<Message key={message.id} from={message.role}>
								{message.role === "user" && (
									<>
										{/* User message attachments */}
										{message.parts.some((part) => part.type === "file") && (
											<MessageAttachments>
												{message.parts
													.filter((part) => part.type === "file")
													.map((part, idx) => (
														<MessageAttachment
															key={`${message.id}-attachment-${idx}`}
															data={part}
														/>
													))}
											</MessageAttachments>
										)}

										{/* User message text */}
										<MessageContent>
											{message.parts
												.filter((part) => part.type === "text")
												.map((part, idx) => (
													<span key={`${message.id}-text-${idx}`}>
														{part.text}
													</span>
												))}
										</MessageContent>
									</>
								)}

								{message.role === "assistant" && (
									<>
										<MessageContent>
											{message.parts.map((part, partIndex) => {
												// Handle text parts
												if (part.type === "text") {
													return (
														<MessageResponse
															key={`${message.id}-part-${partIndex}`}
														>
															{part.text}
														</MessageResponse>
													);
												}

												// Handle tool call parts
												if (part.type === "tool-call") {
													const toolPart = part as ToolUIPart;
													return (
														<Tool key={`${message.id}-tool-${partIndex}`}>
															<ToolHeader
																title={toolPart.toolName}
																type={toolPart.type}
																state={toolPart.state}
															/>
															<ToolContent>
																<ToolInput input={toolPart.input} />
																<ToolOutput
																	output={toolPart.output}
																	errorText={toolPart.errorText}
																/>
															</ToolContent>
														</Tool>
													);
												}

												// Handle reasoning parts
												if (part.type === "reasoning") {
													const reasoningPart = part as ReasoningUIPart;
													return (
														<Reasoning
															key={`${message.id}-reasoning-${partIndex}`}
															isStreaming={
																index === messages.length - 1 && isLoading
															}
														>
															<ReasoningTrigger />
															<ReasoningContent>
																{reasoningPart.text || ""}
															</ReasoningContent>
														</Reasoning>
													);
												}

												return null;
											})}
										</MessageContent>

										{/* Assistant message actions */}
										<MessageToolbar>
											<MessageActions>
												<MessageAction
													tooltip="Copy message"
													onClick={() =>
														copyToClipboard(getMessageText(message))
													}
												>
													<CopyIcon className="size-4" />
												</MessageAction>
												<MessageAction
													tooltip="Regenerate"
													onClick={() => handleRegenerate(message.id)}
													disabled={isLoading}
												>
													<RefreshCwIcon className="size-4" />
												</MessageAction>
											</MessageActions>
										</MessageToolbar>
									</>
								)}
							</Message>
						))
					)}
				</ConversationContent>

				<ConversationScrollButton />
			</Conversation>

			{/* Input area */}
			<div className="sticky bottom-0 mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 bg-background">
				{/* MCP Server Selection */}
				{hasValidKeys && (
					<div className="flex items-center gap-2 flex-wrap">
						{selectedServers.map((server) => (
							<ServerDetailsPopover
								key={server.id}
								serverId={server.id}
								onRemove={() => handleServerRemove(server.id)}
							>
								<Button size="sm" variant="secondary">
									<div className="flex -space-x-3">
										{server.apps.slice(0, 3).map((app) => (
											<div
												key={app.appName}
												className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/70 border border-background"
											>
												<AppLogo
													logo={
														availableApps.find((a) => a.name === app.appName)
															?.logo
													}
													className="h-3.5 w-3.5"
												/>
											</div>
										))}
									</div>
									<span>{server.name}</span>
									<ChevronDown className="h-3 w-3 ml-0.5" />
								</Button>
							</ServerDetailsPopover>
						))}

						{externalServers.map((externalServer) => (
							<ExternalServerDetailsPopover
								key={externalServer.chatMcpServer.id}
								chatMcpServer={externalServer.chatMcpServer}
								onRemove={() =>
									handleExternalServerRemove(externalServer.chatMcpServer.id)
								}
							>
								<Button size="sm" variant="secondary">
									<div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/70 border border-background">
										<MCPIcon className="h-3.5 w-3.5 text-primary" />
									</div>
									<span>
										{externalServer.chatMcpServer.displayName ||
											"External Server"}
									</span>
									<ChevronDown className="h-3 w-3 ml-0.5" />
								</Button>
							</ExternalServerDetailsPopover>
						))}

						<ServerSelectionPopover
							selectedServerIds={localSelectedServerIds}
							onServerAdd={handleServerAdd}
							onExternalServerAdd={handleExternalServerAdd}
						>
							<Button
								variant="secondary"
								size="sm"
								className="flex items-center gap-2"
							>
								<Plus className="h-4 w-4" />
								<span>
									{localSelectedServerIds.length === 0 &&
									externalServers.length === 0 ? (
										"Add Tools"
									) : (
										<MCPIcon className="size-3" />
									)}
								</span>
							</Button>
						</ServerSelectionPopover>
					</div>
				)}

				{/* Input form */}
				{!hasValidKeys ? (
					<div className="relative flex w-full flex-col rounded-3xl border border-border bg-muted px-1 pt-2 shadow-sm">
						<div className="border-t border-border/50 bg-muted/30 px-4 py-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
										<KeyIcon className="size-4" />
									</div>
									<div>
										<div className="text-sm font-medium text-foreground">
											No API Keys Configured
										</div>
										<div className="text-xs text-muted-foreground">
											Add an API key to start chatting with AI models
										</div>
									</div>
								</div>
								<Button
									variant="default"
									size="sm"
									onClick={() => setShowAddKeyDialog(true)}
									className="rounded-xl"
								>
									<KeyIcon className="mr-2 size-4" />
									Add API Key
								</Button>
							</div>
						</div>
					</div>
				) : (
					<PromptInput
						accept="image/*"
						multiple
						onSubmit={async ({ text, files }) => {
							if (!text.trim() && files.length === 0) return;

							await append({
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
										disabled={!hasValidKeys}
									/>
								</PromptInputTools>

								<PromptInputSubmit status={status} />
							</PromptInputFooter>
						</PromptInputBody>
					</PromptInput>
				)}
			</div>

			<AddLLMKeyDialog
				open={showAddKeyDialog}
				onOpenChange={setShowAddKeyDialog}
				existingProviders={existingProviders}
			/>
		</div>
	);
}
