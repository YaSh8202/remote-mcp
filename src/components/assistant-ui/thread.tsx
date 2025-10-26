import {
	ActionBarPrimitive,
	BranchPickerPrimitive,
	ComposerPrimitive,
	ErrorPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
} from "@assistant-ui/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CheckIcon,
	ChevronDown,
	ChevronLeftIcon,
	ChevronRightIcon,
	CopyIcon,
	KeyIcon,
	Plus,
	RefreshCwIcon,
	Square,
} from "lucide-react";
import { type FC, useState } from "react";

import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
import {
	ComposerAddAttachment,
	ComposerAttachments,
	UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { ModelSelector } from "@/components/model-selector";
import { ServerDetailsPopover } from "@/components/server-details-popover";
import { ServerSelectionPopover } from "@/components/server-selection-popover";
import { Button } from "@/components/ui/button";
import type { Chat, ChatMcpServer, McpServer } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import { useMutation } from "@tanstack/react-query";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import { useEffect } from "react";
import { AppLogo } from "../AppLogo";
import ToolsSelector from "../chat/tools-selector";
import { MCPIcon } from "../icons";

type ChatWithMcpServers = Chat & {
	mcpServers?: Array<{
		chatMcpServer: ChatMcpServer;
		mcpServerData: McpServer | null;
	}>;
};

interface ThreadProps {
	currentChat?: ChatWithMcpServers;
}

export const Thread: FC<ThreadProps> = ({ currentChat }) => {
	return (
		<LazyMotion features={domAnimation}>
			<MotionConfig reducedMotion="user">
				<ThreadPrimitive.Root
					className="aui-root * border-border outline-ring/50 aui-thread-root @container flex h-full flex-col bg-background"
					style={{
						["--thread-max-width" as string]: "44rem",
					}}
				>
					<ThreadPrimitive.Viewport className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll px-4">
						<ThreadWelcome />

						<ThreadPrimitive.Messages
							components={{
								UserMessage,
								EditComposer,
								AssistantMessage,
							}}
						/>
						<div className="aui-thread-viewport-spacer min-h-8 grow" />
						<Composer currentChat={currentChat} />
					</ThreadPrimitive.Viewport>
				</ThreadPrimitive.Root>
			</MotionConfig>
		</LazyMotion>
	);
};

const ThreadScrollToBottom: FC = () => {
	return (
		<ThreadPrimitive.ScrollToBottom asChild>
			<TooltipIconButton
				tooltip="Scroll to bottom"
				variant="outline"
				className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
			>
				<ArrowDownIcon />
			</TooltipIconButton>
		</ThreadPrimitive.ScrollToBottom>
	);
};

const ThreadWelcome: FC = () => {
	return (
		<ThreadPrimitive.Empty>
			<div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
				<div className="aui-thread-welcome-center flex w-full flex-grow flex-col items-center justify-center">
					<div className="aui-thread-welcome-message flex size-full flex-col justify-center px-8">
						<m.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							className="aui-thread-welcome-message-motion-1 text-2xl font-semibold"
						>
							Hello there!
						</m.div>
						<m.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							transition={{ delay: 0.1 }}
							className="aui-thread-welcome-message-motion-2 text-2xl text-muted-foreground/65"
						>
							How can I help you today?
						</m.div>
					</div>
				</div>
			</div>
		</ThreadPrimitive.Empty>
	);
};

const ThreadWelcomeSuggestions: FC = () => {
	return (
		<div className="aui-thread-welcome-suggestions grid w-full gap-2 @md:grid-cols-2">
			{[
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
					label: "of using Assistant Cloud?",
					action: "What are the advantages of using Assistant Cloud?",
				},
				{
					title: "Write code to",
					label: "demonstrate topological sorting",
					action: "Write code to demonstrate topological sorting",
				},
			].map((suggestedAction, index) => (
				<m.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.05 * index }}
					key={`suggested-action-${suggestedAction.title}-${index}`}
					className="aui-thread-welcome-suggestion-display [&:nth-child(n+3)]:hidden @md:[&:nth-child(n+3)]:block"
				>
					<ThreadPrimitive.Suggestion
						prompt={suggestedAction.action}
						method="replace"
						autoSend
						asChild
					>
						<Button
							variant="ghost"
							className="aui-thread-welcome-suggestion h-auto w-full flex-1 flex-wrap items-start justify-start gap-1 rounded-3xl border px-5 py-4 text-left text-sm @md:flex-col dark:hover:bg-accent/60"
							aria-label={suggestedAction.action}
						>
							<span className="aui-thread-welcome-suggestion-text-1 font-medium">
								{suggestedAction.title}
							</span>
							<span className="aui-thread-welcome-suggestion-text-2 text-muted-foreground">
								{suggestedAction.label}
							</span>
						</Button>
					</ThreadPrimitive.Suggestion>
				</m.div>
			))}
		</div>
	);
};

const Composer: FC<{ currentChat?: ChatWithMcpServers }> = ({
	currentChat,
}) => {
	const { selectedModel, setSelectedModel } = useChatStore();
	const trpc = useTRPC();
	const [showAddKeyDialog, setShowAddKeyDialog] = useState(false);
	const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
	const queryClient = useQueryClient();
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

	// Get selected servers data
	const selectedServers = servers.filter((server) =>
		selectedServerIds.includes(server.id),
	);

	// Load selected servers from chat MCP servers on mount
	useEffect(() => {
		if (currentChat?.mcpServers) {
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
			setSelectedServerIds(serverIds);
		}
	}, [currentChat?.mcpServers]);

	// Add/remove MCP server mutations
	const addMcpServerMutation = useMutation({
		...trpc.chat.addMcpServer.mutationOptions(),
		onSuccess: () => {
			// Invalidate chat data to reflect new MCP server
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
			// Invalidate chat data to reflect removed MCP server
			queryClient.invalidateQueries({
				queryKey: trpc.chat.listMcpServers.queryKey({
					chatId: currentChat?.id,
				}),
			});
		},
	});

	const handleServerAdd = async (serverId: string) => {
		const newServerIds = [...selectedServerIds, serverId];
		setSelectedServerIds(newServerIds);

		// Add MCP server to chat if we have a current chat
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
	};

	const handleServerRemove = async (serverId: string) => {
		const newServerIds = selectedServerIds.filter((id) => id !== serverId);
		setSelectedServerIds(newServerIds);

		// Remove MCP server from chat if we have a current chat
		if (currentChat) {
			try {
				// Find the chat MCP server record to remove
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
	};

	return (
		<div className="aui-composer-wrapper sticky bottom-0 mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
			<ThreadScrollToBottom />
			<ThreadPrimitive.Empty>
				{hasValidKeys && <ThreadWelcomeSuggestions />}
			</ThreadPrimitive.Empty>

			{/* Server Selection Button - Only show when chat is ready and servers exist */}
			{hasValidKeys && servers.length > 0 && (
				<div className="mx-auto flex items-center gap-2 w-full max-w-[var(--thread-max-width)]">
					{/* Show selected servers */}
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

					<ServerSelectionPopover
						selectedServerIds={selectedServerIds}
						onServerAdd={handleServerAdd}
					>
						<Button
							variant="secondary"
							size="sm"
							className="flex items-center gap-2 "
						>
							<Plus className="h-4 w-4" />
							<span>
								{selectedServerIds.length === 0 ? (
									"Add Servers"
								) : (
									<MCPIcon className="size-3" />
								)}
							</span>
						</Button>
					</ServerSelectionPopover>
				</div>
			)}

			{!hasValidKeys ? (
				<div className="aui-composer-no-keys-wrapper relative flex w-full flex-col rounded-3xl border border-border bg-muted px-1 pt-2 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),0_2px_5px_0px_rgba(0,0,0,0.06)] dark:border-muted-foreground/15">
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
				<ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col rounded-3xl border border-border bg-muted px-1 pt-2 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),0_2px_5px_0px_rgba(0,0,0,0.06)] dark:border-muted-foreground/15">
					<ComposerAttachments />
					<ComposerPrimitive.Input
						placeholder="Send a message..."
						className="aui-composer-input mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-base outline-none placeholder:text-muted-foreground focus:outline-primary"
						rows={1}
						autoFocus
						aria-label="Message input"
					/>
					<div className="aui-composer-action-wrapper relative mx-1 mt-2 mb-2 flex items-center justify-between">
						<div className="flex items-center gap-0.5">
							<ComposerAddAttachment />
							<ModelSelector
								selectedModel={selectedModel}
								onModelSelect={setSelectedModel}
								disabled={!hasValidKeys}
							/>
							{(currentChat?.mcpServers?.length ?? 0) > 0 && <ToolsSelector />}
						</div>
						<div className="flex items-center gap-2">
							<SendButton />
						</div>
					</div>
				</ComposerPrimitive.Root>
			)}

			<AddLLMKeyDialog
				open={showAddKeyDialog}
				onOpenChange={setShowAddKeyDialog}
				existingProviders={existingProviders}
			/>
		</div>
	);
};

const SendButton: FC = () => {
	return (
		<>
			<ThreadPrimitive.If running={false}>
				<ComposerPrimitive.Send asChild>
					<TooltipIconButton
						tooltip="Send message"
						side="bottom"
						type="submit"
						variant="default"
						size="icon"
						className="aui-composer-send size-[34px] rounded-full p-1"
						aria-label="Send message"
					>
						<ArrowUpIcon className="aui-composer-send-icon size-5" />
					</TooltipIconButton>
				</ComposerPrimitive.Send>
			</ThreadPrimitive.If>

			<ThreadPrimitive.If running>
				<ComposerPrimitive.Cancel asChild>
					<Button
						type="button"
						variant="default"
						size="icon"
						className="aui-composer-cancel size-[34px] rounded-full border border-muted-foreground/60 hover:bg-primary/75 dark:border-muted-foreground/90"
						aria-label="Stop generating"
					>
						<Square className="aui-composer-cancel-icon size-3.5 fill-white dark:fill-black" />
					</Button>
				</ComposerPrimitive.Cancel>
			</ThreadPrimitive.If>
		</>
	);
};

const MessageError: FC = () => {
	return (
		<MessagePrimitive.Error>
			<ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive dark:bg-destructive/5 dark:text-red-200">
				<ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
			</ErrorPrimitive.Root>
		</MessagePrimitive.Error>
	);
};

const AssistantMessage: FC = () => {
	return (
		<MessagePrimitive.Root asChild>
			<div
				className="aui-assistant-message-root relative mx-auto w-full max-w-[var(--thread-max-width)] animate-in py-4 duration-200 fade-in slide-in-from-bottom-1 last:mb-24"
				data-role="assistant"
			>
				<div className="aui-assistant-message-content mx-2 leading-7 break-words text-foreground">
					<MessagePrimitive.Parts
						components={{
							Text: MarkdownText,
							tools: { Fallback: ToolFallback },
						}}
					/>
					<MessageError />
				</div>

				<div className="aui-assistant-message-footer mt-2 ml-2 flex">
					{/* <BranchPicker /> */}
					<AssistantActionBar />
				</div>
			</div>
		</MessagePrimitive.Root>
	);
};

const AssistantActionBar: FC = () => {
	return (
		<ActionBarPrimitive.Root
			hideWhenRunning
			autohide="not-last"
			autohideFloat="single-branch"
			className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
		>
			<ActionBarPrimitive.Copy asChild>
				<TooltipIconButton tooltip="Copy">
					<MessagePrimitive.If copied>
						<CheckIcon />
					</MessagePrimitive.If>
					<MessagePrimitive.If copied={false}>
						<CopyIcon />
					</MessagePrimitive.If>
				</TooltipIconButton>
			</ActionBarPrimitive.Copy>
			<ActionBarPrimitive.Reload asChild>
				<TooltipIconButton tooltip="Regenerate">
					<RefreshCwIcon />
				</TooltipIconButton>
			</ActionBarPrimitive.Reload>
		</ActionBarPrimitive.Root>
	);
};

const UserMessage: FC = () => {
	return (
		<MessagePrimitive.Root asChild>
			<div
				className="aui-user-message-root mx-auto grid w-full max-w-[var(--thread-max-width)] animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-4 duration-200 fade-in slide-in-from-bottom-1 first:mt-3 last:mb-5 [&:where(>*)]:col-start-2"
				data-role="user"
			>
				<UserMessageAttachments />

				<div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
					<div className="aui-user-message-content rounded-3xl bg-muted px-5 py-2.5 break-words text-foreground">
						<MessagePrimitive.Parts />
					</div>
					{/* <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
						<UserActionBar />
					</div> */}
				</div>

				<BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
			</div>
		</MessagePrimitive.Root>
	);
};

// TODO: Enable Message threading backend support to enable Edit action
// const UserActionBar: FC = () => {
// 	return (
// 		<ActionBarPrimitive.Root
// 			hideWhenRunning
// 			autohide="not-last"
// 			className="aui-user-action-bar-root flex flex-col items-end"
// 		>
// 			<ActionBarPrimitive.Edit asChild>
// 				<TooltipIconButton tooltip="Edit" className="aui-user-action-edit p-4">
// 					<PencilIcon />
// 				</TooltipIconButton>
// 			</ActionBarPrimitive.Edit>
// 		</ActionBarPrimitive.Root>
// 	);
// };

const EditComposer: FC = () => {
	return (
		<div className="aui-edit-composer-wrapper mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-2 first:mt-4">
			<ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-7/8 flex-col rounded-xl bg-muted">
				<ComposerPrimitive.Input
					className="aui-edit-composer-input flex min-h-[60px] w-full resize-none bg-transparent p-4 text-foreground outline-none"
					autoFocus
				/>

				<div className="aui-edit-composer-footer mx-3 mb-3 flex items-center justify-center gap-2 self-end">
					<ComposerPrimitive.Cancel asChild>
						<Button variant="ghost" size="sm" aria-label="Cancel edit">
							Cancel
						</Button>
					</ComposerPrimitive.Cancel>
					<ComposerPrimitive.Send asChild>
						<Button size="sm" aria-label="Update message">
							Update
						</Button>
					</ComposerPrimitive.Send>
				</div>
			</ComposerPrimitive.Root>
		</div>
	);
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
	className,
	...rest
}) => {
	return (
		<BranchPickerPrimitive.Root
			hideWhenSingleBranch
			className={cn(
				"aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-xs text-muted-foreground",
				className,
			)}
			{...rest}
		>
			<BranchPickerPrimitive.Previous asChild>
				<TooltipIconButton tooltip="Previous">
					<ChevronLeftIcon />
				</TooltipIconButton>
			</BranchPickerPrimitive.Previous>
			<span className="aui-branch-picker-state font-medium">
				<BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
			</span>
			<BranchPickerPrimitive.Next asChild>
				<TooltipIconButton tooltip="Next">
					<ChevronRightIcon />
				</TooltipIconButton>
			</BranchPickerPrimitive.Next>
		</BranchPickerPrimitive.Root>
	);
};
