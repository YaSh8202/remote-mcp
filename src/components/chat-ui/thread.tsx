"use client";

import { AppLogo } from "@/components/AppLogo";
import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
import { ExternalServerDetailsPopover } from "@/components/external-server-details-popover";
import { MCPIcon } from "@/components/icons";
import { ModelSelector } from "@/components/model-selector";
import { ServerDetailsPopover } from "@/components/server-details-popover";
import { ServerSelectionPopover } from "@/components/server-selection-popover";
import { Button } from "@/components/ui/button";
import type { Chat, ChatMcpServer, McpServer } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { useChatStore } from "@/store/chat-store";
import { useNewChatStore } from "@/store/new-chat-store";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { ChevronDown, KeyIcon, Plus } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import ToolsSelector from "../chat/tools-selector";
import { Conversation, WelcomeScreen } from "./conversation";
import { PromptInput } from "./prompt-input";

type ChatWithMcpServers = Chat & {
	mcpServers?: Array<{
		chatMcpServer: ChatMcpServer;
		mcpServerData: McpServer | null;
	}>;
};

interface ThreadProps {
	currentChat?: ChatWithMcpServers;
	isNewChat?: boolean;
}

export const Thread: FC<ThreadProps> = ({ currentChat, isNewChat = false }) => {
	const { selectedModel, setSelectedModel } = useChatStore();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [showAddKeyDialog, setShowAddKeyDialog] = useState(false);

	// For existing chats, use local state. For new chats, use the store.
	const [localSelectedServerIds, setLocalSelectedServerIds] = useState<
		string[]
	>([]);
	const newChatStore = useNewChatStore();

	const { data: keys = [] } = useSuspenseQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);

	const { data: servers = [] } = useSuspenseQuery(
		trpc.mcpServer.list.queryOptions(),
	);

	const { data: availableApps } = useSuspenseQuery(
		useTRPC().mcpApp.getAvailableApps.queryOptions(),
	);

	const validKeys = keys.filter((key) => key.isValid === true);
	const hasValidKeys = validKeys.length > 0;
	const existingProviders = validKeys.map((key) => key.provider);

	// Use appropriate state based on whether this is a new chat or existing chat
	const selectedServerIds = isNewChat
		? newChatStore.selectedServerIds
		: localSelectedServerIds;
	const setSelectedServerIds = isNewChat
		? newChatStore.setServers
		: setLocalSelectedServerIds;

	// Get selected servers data (remote servers only)
	const selectedServers = servers.filter((server) =>
		selectedServerIds.includes(server.id),
	);

	// Get external servers from chat
	const externalServers = currentChat?.mcpServers?.filter(
		(server) => !server.chatMcpServer.isRemoteMcp,
	);

	// Load selected servers from chat MCP servers on mount (only for existing chats)
	useEffect(() => {
		if (!isNewChat && currentChat?.mcpServers) {
			const serverIds = currentChat.mcpServers
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
	}, [currentChat?.mcpServers, isNewChat]);

	// Add/remove MCP server mutations
	const addMcpServerMutation = useMutation({
		...trpc.chat.addMcpServer.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.chat.listMcpServers.queryKey({
					chatId: currentChat?.id,
				}),
			});
		},
	});

	const removeMcpServerMutation = useMutation({
		...trpc.chat.removeMcpServer.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.chat.listMcpServers.queryKey({
					chatId: currentChat?.id,
				}),
			});
		},
	});

	const validateExternalServerMutation = useMutation({
		...trpc.mcpServer.validateExternal.mutationOptions(),
	});

	const handleServerAdd = async (serverId: string) => {
		if (isNewChat) {
			newChatStore.addServer(serverId);
		} else {
			const newServerIds = [...selectedServerIds, serverId];
			setSelectedServerIds(newServerIds);

			if (currentChat) {
				try {
					await addMcpServerMutation.mutateAsync({
						chatId: currentChat.id,
						isRemoteMcp: true,
						mcpServerId: serverId,
						includeAllTools: true,
						tools: [],
					});
				} catch (error) {
					console.error("Failed to add MCP server to chat:", error);
				}
			}
		}
	};

	const handleServerRemove = async (serverId: string) => {
		if (isNewChat) {
			newChatStore.removeServer(serverId);
		} else {
			const newServerIds = selectedServerIds.filter((id) => id !== serverId);
			setSelectedServerIds(newServerIds);

			if (currentChat) {
				try {
					const chatMcpServer = currentChat.mcpServers?.find(
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
		}
	};

	const handleExternalServerRemove = async (chatMcpServerId: string) => {
		if (currentChat) {
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
		if (isNewChat) {
			console.warn(
				"External MCP servers for new chats need to be implemented in the store",
			);
			return {
				success: false,
				error: "External servers not supported for new chats yet",
			};
		}

		if (!currentChat) {
			return { success: false, error: "No active chat found" };
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
				chatId: currentChat.id,
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

	const defaultSuggestions = [
		{
			title: "What's the weather",
			label: "in San Francisco?",
			action: "What's the weather in San Francisco?",
		},
		{
			title: "Help me write an essay",
			label: "about AI chat applications",
			action: "Help me write an essay about AI chat applications",
		},
		{
			title: "What are the advantages",
			label: "of using Remote MCP?",
			action: "What are the advantages of using Remote MCP?",
		},
		{
			title: "Write code to",
			label: "demonstrate topological sorting",
			action: "Write code to demonstrate topological sorting",
		},
	];

	return (
		<Conversation
			emptyState={
				hasValidKeys ? <WelcomeScreen suggestions={defaultSuggestions} /> : null
			}
		>
			<div className="sticky bottom-0 mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
				{/* Server Selection */}
				{hasValidKeys && (
					<div className="mx-auto flex items-center gap-2 w-full max-w-[var(--thread-max-width)] flex-wrap">
						{/* Show selected remote servers */}
						{selectedServers.map((server) => (
							<ServerDetailsPopover
								key={server.id}
								serverId={server.id}
								onRemove={() => handleServerRemove(server.id)}
							>
								<Button size={"sm"} variant={"secondary"} className="">
									<div className="flex -space-x-3">
										{server.apps.slice(0, 3).map((app) => (
											<div
												key={app.appName}
												className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/70 border border-background"
											>
												<AppLogo
													key={app.appName}
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

						{/* Show external servers */}
						{externalServers?.map((externalServer) => (
							<ExternalServerDetailsPopover
								key={externalServer.chatMcpServer.id}
								chatMcpServer={externalServer.chatMcpServer}
								onRemove={() =>
									handleExternalServerRemove(externalServer.chatMcpServer.id)
								}
							>
								<Button size={"sm"} variant={"secondary"} className="">
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
							selectedServerIds={selectedServerIds}
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
									{selectedServerIds.length === 0 &&
									(!externalServers || externalServers.length === 0) ? (
										"Add Tools"
									) : (
										<MCPIcon className="size-3" />
									)}
								</span>
							</Button>
						</ServerSelectionPopover>
					</div>
				)}

				{/* Input Area */}
				{!hasValidKeys ? (
					<div className="relative flex w-full flex-col rounded-3xl border border-border bg-muted px-1 pt-2 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),0_2px_5px_0px_rgba(0,0,0,0.06)] dark:border-muted-foreground/15">
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
					<PromptInput disabled={!hasValidKeys}>
						<ModelSelector
							selectedModel={selectedModel}
							onModelSelect={setSelectedModel}
							disabled={!hasValidKeys}
						/>
						{(currentChat?.mcpServers?.length ?? 0) > 0 && <ToolsSelector />}
					</PromptInput>
				)}

				<AddLLMKeyDialog
					open={showAddKeyDialog}
					onOpenChange={setShowAddKeyDialog}
					existingProviders={existingProviders}
				/>
			</div>
		</Conversation>
	);
};
