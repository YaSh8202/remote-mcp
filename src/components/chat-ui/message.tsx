"use client";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";
import type { Message, ToolInvocation } from "@ai-sdk/react";
import {
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CopyIcon,
	RefreshCwIcon,
} from "lucide-react";
import { type FC, useState } from "react";
import { Markdown } from "./markdown";
import { Reasoning } from "./reasoning";
import { Tool } from "./tool";

interface MessageProps {
	message: Message;
	onReload?: () => void;
	isLast?: boolean;
}

export const AssistantMessage: FC<MessageProps> = ({
	message,
	onReload,
	isLast,
}) => {
	const [isCopied, setIsCopied] = useState(false);

	const handleCopy = () => {
		const textContent =
			typeof message.content === "string"
				? message.content
				: message.content
						.filter((part) => part.type === "text")
						.map((part) => ("text" in part ? part.text : ""))
						.join("\n");

		navigator.clipboard.writeText(textContent).then(() => {
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		});
	};

	// Extract content parts
	const textContent =
		typeof message.content === "string"
			? message.content
			: message.content
					.filter((part) => part.type === "text")
					.map((part) => ("text" in part ? part.text : ""))
					.join("\n");

	// Handle reasoning content
	const reasoningContent =
		typeof message.content !== "string"
			? message.content.find((part) => part.type === "reasoning")
			: undefined;

	const hasToolInvocations =
		message.toolInvocations && message.toolInvocations.length > 0;

	return (
		<div
			className="relative mx-auto w-full max-w-[44rem] animate-in py-4 duration-200 fade-in slide-in-from-bottom-1 last:mb-24"
			data-role="assistant"
		>
			<div className="mx-2 leading-7 break-words text-foreground">
				{/* Reasoning block */}
				{reasoningContent && "reasoning" in reasoningContent && (
					<Reasoning
						text={reasoningContent.reasoning}
						status={message.experimental_isStreaming ? "running" : "complete"}
					/>
				)}

				{/* Tool invocations */}
				{hasToolInvocations &&
					message.toolInvocations?.map((toolInvocation, index) => (
						<Tool key={index} toolInvocation={toolInvocation} />
					))}

				{/* Main text content */}
				{textContent && <Markdown>{textContent}</Markdown>}

				{/* Error display */}
				{message.error && (
					<div className="mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive dark:bg-destructive/5 dark:text-red-200">
						{message.error.message || "An error occurred"}
					</div>
				)}
			</div>

			{/* Action bar */}
			<div className="mt-2 ml-2 flex">
				<div className="col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground">
					<TooltipIconButton tooltip="Copy" onClick={handleCopy}>
						{isCopied ? <CheckIcon /> : <CopyIcon />}
					</TooltipIconButton>
					{isLast && onReload && (
						<TooltipIconButton tooltip="Regenerate" onClick={onReload}>
							<RefreshCwIcon />
						</TooltipIconButton>
					)}
				</div>
			</div>
		</div>
	);
};

interface UserMessageProps {
	message: Message;
	attachments?: React.ReactNode;
}

export const UserMessage: FC<UserMessageProps> = ({ message, attachments }) => {
	const textContent =
		typeof message.content === "string"
			? message.content
			: message.content
					.filter((part) => part.type === "text")
					.map((part) => ("text" in part ? part.text : ""))
					.join("\n");

	return (
		<div
			className="mx-auto grid w-full max-w-[44rem] animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-4 duration-200 fade-in slide-in-from-bottom-1 first:mt-3 last:mb-5 [&:where(>*)]:col-start-2"
			data-role="user"
		>
			{attachments && (
				<div className="col-span-full col-start-1 row-start-1 flex w-full flex-row justify-end gap-2">
					{attachments}
				</div>
			)}

			<div className="relative col-start-2 min-w-0">
				<div className="rounded-3xl bg-muted px-5 py-2.5 break-words text-foreground">
					{textContent}
				</div>
			</div>
		</div>
	);
};

interface BranchPickerProps {
	currentBranch: number;
	totalBranches: number;
	onPrevious: () => void;
	onNext: () => void;
	className?: string;
}

export const BranchPicker: FC<BranchPickerProps> = ({
	currentBranch,
	totalBranches,
	onPrevious,
	onNext,
	className,
}) => {
	if (totalBranches <= 1) return null;

	return (
		<div
			className={cn(
				"mr-2 -ml-2 inline-flex items-center text-xs text-muted-foreground",
				className,
			)}
		>
			<TooltipIconButton tooltip="Previous" onClick={onPrevious}>
				<ChevronLeftIcon />
			</TooltipIconButton>
			<span className="font-medium">
				{currentBranch} / {totalBranches}
			</span>
			<TooltipIconButton tooltip="Next" onClick={onNext}>
				<ChevronRightIcon />
			</TooltipIconButton>
		</div>
	);
};
