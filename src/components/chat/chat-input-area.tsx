"use client";

import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { ChatStatus } from "ai";
import { KeyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
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
import { AttachFileButton } from "@/components/chat/attach-file-button";
import ToolsSelector from "@/components/chat/chat-tools-selector";
import { ServerSelectionBar } from "@/components/chat/server-selection-bar";
import { ModelSelector } from "@/components/model-selector";
import { Button } from "@/components/ui/button";
import type { ChatMcpServer, McpServer } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import type { LLMProvider } from "@/types/models";

export type ChatInputAreaProps = {
	onSubmit: (input: PromptInputMessage) => Promise<void>;
	status?: ChatStatus;
	selectedModel: string;
	onModelSelect: (model: string, provider: LLMProvider) => void;
	chatId?: string;
	currentChatServers?: Array<{
		chatMcpServer: ChatMcpServer;
		mcpServerData: McpServer | null;
	}>;
	selectedServerIds?: string[];
	onServerAdd?: (serverId: string) => void | Promise<void>;
	onServerRemove?: (serverId: string) => void | Promise<void>;
	placeholder?: string;
	globalDrop?: boolean;
};

export function ChatInputArea({
	onSubmit,
	status,
	selectedModel,
	onModelSelect,
	chatId,
	currentChatServers = [],
	selectedServerIds: externalSelectedServerIds,
	onServerAdd: externalOnServerAdd,
	onServerRemove: externalOnServerRemove,
	placeholder = "Send a message...",
	globalDrop = true,
}: ChatInputAreaProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [showAddKeyDialog, setShowAddKeyDialog] = useState(false);
	const [localSelectedServerIds, setLocalSelectedServerIds] = useState<
		string[]
	>([]);

	const { data: keys = [] } = useSuspenseQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);

	const validKeys = keys.filter((key) => key.isValid === true);
	const hasValidKeys = validKeys.length > 0;
	const existingProviders = validKeys.map((key) => key.provider);

	// Use external selectedServerIds if provided (for new chat store), otherwise use local state
	const selectedServerIds = externalSelectedServerIds ?? localSelectedServerIds;

	// Get external servers from chat (only for existing chats with chatId)
	const externalServers = currentChatServers.filter(
		(server) => !server.chatMcpServer.isRemoteMcp,
	);

	// Load selected servers from chat on mount (only for existing chats)
	useEffect(() => {
		if (chatId && currentChatServers.length > 0 && !externalSelectedServerIds) {
			const serverIds = currentChatServers
				.filter(
					(
						server,
					): server is typeof server & {
						mcpServerData: NonNullable<typeof server.mcpServerData>;
					} =>
						server.chatMcpServer.isRemoteMcp && server.mcpServerData !== null,
				)
				.map((server) => server.mcpServerData.id);
			setLocalSelectedServerIds(serverIds);
		}
	}, [chatId, currentChatServers, externalSelectedServerIds]);

	// Mutations (only for existing chats)
	const addMcpServerMutation = useMutation({
		...trpc.chat.addMcpServer.mutationOptions(),
		onSuccess: () => {
			if (chatId) {
				queryClient.invalidateQueries({
					queryKey: trpc.chat.listMcpServers.queryKey({ chatId }),
				});
			}
		},
	});

	const removeMcpServerMutation = useMutation({
		...trpc.chat.removeMcpServer.mutationOptions(),
		onSuccess: () => {
			if (chatId) {
				queryClient.invalidateQueries({
					queryKey: trpc.chat.listMcpServers.queryKey({ chatId }),
				});
			}
		},
	});

	const validateExternalServerMutation = useMutation({
		...trpc.mcpServer.validateExternal.mutationOptions(),
	});

	// Server management handlers
	const handleServerAdd = async (serverId: string) => {
		// Use external handler if provided (for new chat)
		if (externalOnServerAdd) {
			await externalOnServerAdd(serverId);
			return;
		}

		// Otherwise, manage locally and persist to chat (for existing chat)
		const newServerIds = [...localSelectedServerIds, serverId];
		setLocalSelectedServerIds(newServerIds);

		if (chatId) {
			try {
				await addMcpServerMutation.mutateAsync({
					chatId,
					isRemoteMcp: true,
					mcpServerId: serverId,
					includeAllTools: true,
					tools: [],
				});
			} catch (error) {
				console.error("Failed to add MCP server to chat:", error);
			}
		}
	};

	const handleServerRemove = async (serverId: string) => {
		// Use external handler if provided (for new chat)
		if (externalOnServerRemove) {
			await externalOnServerRemove(serverId);
			return;
		}

		// Otherwise, manage locally and persist to chat (for existing chat)
		const newServerIds = localSelectedServerIds.filter((id) => id !== serverId);
		setLocalSelectedServerIds(newServerIds);

		if (chatId) {
			try {
				const chatMcpServer = currentChatServers.find(
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
		}
	};

	const handleExternalServerRemove = async (chatMcpServerId: string) => {
		if (chatId) {
			try {
				await removeMcpServerMutation.mutateAsync({
					id: chatMcpServerId,
				});
			} catch (error) {
				console.error("Failed to remove external MCP server from chat:", error);
			}
		}
	};

	const handleExternalServerAdd = async (config: {
		displayName: string;
		url: string;
		type: "http" | "sse";
		headers?: Record<string, string>;
	}): Promise<{ success: boolean; error?: string }> => {
		if (!chatId) {
			return {
				success: false,
				error: "External servers can only be added to existing chats",
			};
		}

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
				chatId,
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

	// No API keys state
	if (!hasValidKeys) {
		return (
			<div className="bg-background">
				<div className="max-w-4xl mx-auto p-4">
					<div className="rounded-3xl border border-border bg-muted px-6 py-4">
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

					<AddLLMKeyDialog
						open={showAddKeyDialog}
						onOpenChange={setShowAddKeyDialog}
						existingProviders={existingProviders}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className=" bg-background">
			<div className="max-w-4xl mx-auto p-4 space-y-3">
				{/* Server Selection Bar */}
				<ServerSelectionBar
					selectedServerIds={selectedServerIds}
					onServerAdd={handleServerAdd}
					onServerRemove={handleServerRemove}
					onExternalServerAdd={handleExternalServerAdd}
					externalServers={externalServers}
					onExternalServerRemove={
						chatId ? handleExternalServerRemove : undefined
					}
				/>

				{/* Prompt Input */}
				<PromptInput
					onSubmit={onSubmit}
					globalDrop={globalDrop}
					className="shadow-lg"
				>
					<PromptInputBody>
						<PromptInputAttachments>
							{(attachment) => (
								<PromptInputAttachment key={attachment.id} data={attachment} />
							)}
						</PromptInputAttachments>
						<PromptInputTextarea
							placeholder={placeholder}
							className="min-h-[60px] resize-none"
						/>
					</PromptInputBody>
					<PromptInputFooter className="flex items-center justify-between px-3 py-2">
						<div className="flex items-center gap-2">
							<AttachFileButton />
							<ModelSelector
								selectedModel={selectedModel}
								onModelSelect={onModelSelect}
								disabled={!hasValidKeys}
							/>
							<ToolsSelector />
						</div>
						<PromptInputSubmit status={status} />
					</PromptInputFooter>
				</PromptInput>
			</div>
		</div>
	);
}
