import {
	ActionBarPrimitive,
	BranchPickerPrimitive,
	ComposerPrimitive,
	ErrorPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
} from "@assistant-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CopyIcon,
	KeyIcon,
	PaperclipIcon,
	PencilIcon,
	RefreshCwIcon,
	StopCircleIcon,
} from "lucide-react";
import { type FC, useEffect, useState } from "react";

import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { ModelSelector } from "@/components/model-selector";
import { Button } from "@/components/ui/button";
import { useChatContext } from "@/contexts/chat-context";
import { useModels } from "@/hooks/use-models";
import { useTRPC } from "@/integrations/trpc/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MarkdownText } from "./markdown-text";
import { ToolFallback } from "./tool-fallback";

export const Thread: FC = () => {
	return (
		<ThreadPrimitive.Root
			className="bg-background flex h-full flex-col overflow-hidden relative"
			style={{
				["--thread-max-width" as string]: "48rem",
				["--thread-padding-x" as string]: "1rem",
			}}
		>
			<ThreadPrimitive.Viewport className="relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto pb-32">
				<ThreadWelcome />

				<ThreadPrimitive.Messages
					components={{
						UserMessage,
						EditComposer,
						AssistantMessage,
					}}
				/>

				<ThreadPrimitive.If empty={false}>
					<motion.div className="min-h-6 min-w-6 shrink-0" />
				</ThreadPrimitive.If>
			</ThreadPrimitive.Viewport>

			<div className="absolute bottom-0 left-0 right-0 bg-background">
				<Composer />
			</div>
		</ThreadPrimitive.Root>
	);
};

const ThreadScrollToBottom: FC = () => {
	return (
		<ThreadPrimitive.ScrollToBottom asChild>
			<TooltipIconButton
				tooltip="Scroll to bottom"
				variant="outline"
				className="dark:bg-background dark:hover:bg-accent absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible"
			>
				<ArrowDownIcon />
			</TooltipIconButton>
		</ThreadPrimitive.ScrollToBottom>
	);
};

const ThreadWelcome: FC = () => {
	return (
		<ThreadPrimitive.Empty>
			<div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col px-[var(--thread-padding-x)]">
				<div className="flex w-full flex-grow flex-col items-center justify-center">
					<div className="flex size-full flex-col justify-center px-8 md:mt-20">
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							transition={{ delay: 0.5 }}
							className="text-2xl font-semibold"
						>
							Hello there!
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							transition={{ delay: 0.6 }}
							className="text-muted-foreground/65 text-2xl"
						>
							How can I help you today?
						</motion.div>
					</div>
				</div>
			</div>
		</ThreadPrimitive.Empty>
	);
};

const ThreadWelcomeSuggestions: FC = () => {
	return (
		<div className="grid w-full gap-2 sm:grid-cols-2">
			{[
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
				{
					title: "Help me write an essay",
					label: "about AI chat applications",
					action: "Help me write an essay about AI chat applications",
				},
				{
					title: "What is the weather",
					label: "in San Francisco?",
					action: "What is the weather in San Francisco?",
				},
			].map((suggestedAction, index) => (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.05 * index }}
					key={`suggested-action-${suggestedAction.title}-${index}`}
					className="[&:nth-child(n+3)]:hidden sm:[&:nth-child(n+3)]:block"
				>
					<ThreadPrimitive.Suggestion
						prompt={suggestedAction.action}
						method="replace"
						autoSend
						asChild
					>
						<Button
							variant="ghost"
							className="dark:hover:bg-accent/60 h-auto w-full flex-1 flex-wrap items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
							aria-label={suggestedAction.action}
						>
							<span className="font-medium">{suggestedAction.title}</span>
							<p className="text-muted-foreground">{suggestedAction.label}</p>
						</Button>
					</ThreadPrimitive.Suggestion>
				</motion.div>
			))}
		</div>
	);
};

const Composer: FC = () => {
	const { selectedModel, setSelectedModel } = useChatContext();
	const trpc = useTRPC();
	const [showAddKeyDialog, setShowAddKeyDialog] = useState(false);

	const { data: keys = [] } = useSuspenseQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);

	const { models } = useModels();

	const validKeys = keys.filter((key) => key.isValid === true);
	const hasValidKeys = validKeys.length > 0;
	const existingProviders = validKeys.map((key) => key.provider);

	// Auto-select first available model if none selected
	useEffect(() => {
		if (!selectedModel && validKeys.length > 0) {
			const firstKey = validKeys[0];
			const providerModels = models.filter(
				(m) => m.meta.provider === firstKey?.provider,
			);

			if (providerModels.length > 0) {
				setSelectedModel(providerModels[0].meta.id, firstKey.provider);
			}
		}
	}, [validKeys, selectedModel, setSelectedModel, models]);

	return (
		<div className="bg-background relative mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)] pb-4 md:pb-6">
			<ThreadScrollToBottom />
			<ThreadPrimitive.Empty>
				<ThreadWelcomeSuggestions />
			</ThreadPrimitive.Empty>
			<div className="relative">
				<ComposerPrimitive.Root className="group relative flex w-full flex-col rounded-3xl border border-border bg-background shadow-sm transition-all duration-200 focus-within:border-primary focus-within:shadow-md focus-within:shadow-primary/10">
					<div className="p-4">
						<ComposerPrimitive.Input
							placeholder="Type your message here..."
							className="placeholder:text-muted-foreground/60 max-h-32 min-h-12 w-full resize-none border-0 bg-transparent px-0 py-2 text-base outline-none focus:ring-0 focus-visible:ring-0"
							rows={1}
							autoFocus
							aria-label="Message input"
						/>
					</div>

					{/* Action Bar */}
					{!hasValidKeys ? (
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
					) : (
						<div className="border-t border-border/50 px-4 py-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1">
									<ModelSelector
										selectedModel={selectedModel}
										onModelSelect={setSelectedModel}
										disabled={!hasValidKeys}
									/>
									<AttachmentButton />
								</div>
								<div className="flex items-center gap-2">
									<SendButton />
								</div>
							</div>
						</div>
					)}
				</ComposerPrimitive.Root>

				<AddLLMKeyDialog
					open={showAddKeyDialog}
					onOpenChange={setShowAddKeyDialog}
					existingProviders={existingProviders}
				/>
			</div>
		</div>
	);
};

const AttachmentButton: FC = () => {
	return (
		<TooltipIconButton
			tooltip="Attach file"
			variant="ghost"
			size="icon"
			className="hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
			onClick={() => {
				console.log("Attachment clicked - not implemented");
			}}
		>
			<PaperclipIcon className="size-4" />
		</TooltipIconButton>
	);
};

const SendButton: FC = () => {
	return (
		<>
			<ThreadPrimitive.If running={false}>
				<ComposerPrimitive.Send asChild>
					<Button
						type="submit"
						variant="default"
						className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border"
						aria-label="Send message"
					>
						<ArrowUpIcon className="size-5" />
					</Button>
				</ComposerPrimitive.Send>
			</ThreadPrimitive.If>

			<ThreadPrimitive.If running>
				<ComposerPrimitive.Cancel asChild>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="rounded-2xl px-4 transition-all duration-200"
						aria-label="Stop generating"
					>
						<StopCircleIcon className="size-4" />
						<span className="ml-2 hidden sm:inline">Stop</span>
					</Button>
				</ComposerPrimitive.Cancel>
			</ThreadPrimitive.If>
		</>
	);
};

const MessageError: FC = () => {
	return (
		<MessagePrimitive.Error>
			<ErrorPrimitive.Root className="border-destructive bg-destructive/10 dark:bg-destructive/5 text-destructive mt-2 rounded-md border p-3 text-sm dark:text-red-200">
				<ErrorPrimitive.Message className="line-clamp-2" />
			</ErrorPrimitive.Root>
		</MessagePrimitive.Error>
	);
};

const AssistantMessage: FC = () => {
	return (
		<MessagePrimitive.Root asChild>
			<motion.div
				className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] px-[var(--thread-padding-x)] py-4"
				initial={{ y: 5, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				data-role="assistant"
			>
				<div className="ring-border bg-background col-start-1 row-start-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-1">
					<StarIcon size={14} />
				</div>

				<div className="text-foreground col-span-2 col-start-2 row-start-1 ml-4 break-words leading-7">
					<MessagePrimitive.Content
						components={{
							Text: MarkdownText,
							tools: { Fallback: ToolFallback },
						}}
					/>
					<MessageError />
				</div>

				<AssistantActionBar />

				<BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
			</motion.div>
		</MessagePrimitive.Root>
	);
};

const AssistantActionBar: FC = () => {
	return (
		<ActionBarPrimitive.Root
			hideWhenRunning
			autohide="not-last"
			autohideFloat="single-branch"
			className="text-muted-foreground data-floating:bg-background data-floating:absolute data-floating:mt-2 data-floating:rounded-md data-floating:border data-floating:p-1 data-floating:shadow-sm col-start-3 row-start-2 ml-3 mt-3 flex gap-1"
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
				<TooltipIconButton tooltip="Refresh">
					<RefreshCwIcon />
				</TooltipIconButton>
			</ActionBarPrimitive.Reload>
		</ActionBarPrimitive.Root>
	);
};

const UserMessage: FC = () => {
	return (
		<MessagePrimitive.Root asChild>
			<motion.div
				className="mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-1 px-[var(--thread-padding-x)] py-4 [&:where(>*)]:col-start-2"
				initial={{ y: 5, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				data-role="user"
			>
				<UserActionBar />

				<div className="bg-muted text-foreground col-start-2 break-words rounded-3xl px-5 py-2.5">
					<MessagePrimitive.Content components={{ Text: MarkdownText }} />
				</div>

				<BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
			</motion.div>
		</MessagePrimitive.Root>
	);
};

const UserActionBar: FC = () => {
	return (
		<ActionBarPrimitive.Root
			hideWhenRunning
			autohide="not-last"
			className="col-start-1 mr-3 mt-2.5 flex flex-col items-end"
		>
			<ActionBarPrimitive.Edit asChild>
				<TooltipIconButton tooltip="Edit">
					<PencilIcon />
				</TooltipIconButton>
			</ActionBarPrimitive.Edit>
		</ActionBarPrimitive.Root>
	);
};

const EditComposer: FC = () => {
	return (
		<div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-[var(--thread-padding-x)]">
			<ComposerPrimitive.Root className="bg-muted max-w-7/8 ml-auto flex w-full flex-col rounded-xl">
				<ComposerPrimitive.Input
					className="text-foreground flex min-h-[60px] w-full resize-none bg-transparent p-4 outline-none"
					autoFocus
				/>

				<div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
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
				"text-muted-foreground inline-flex items-center text-xs",
				className,
			)}
			{...rest}
		>
			<BranchPickerPrimitive.Previous asChild>
				<TooltipIconButton tooltip="Previous">
					<ChevronLeftIcon />
				</TooltipIconButton>
			</BranchPickerPrimitive.Previous>
			<span className="font-medium">
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

const StarIcon = ({ size = 14 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<title>Star Icon</title>
		<path
			d="M8 0L9.79611 6.20389L16 8L9.79611 9.79611L8 16L6.20389 9.79611L0 8L6.20389 6.20389L8 0Z"
			fill="currentColor"
		/>
	</svg>
);
