"use client";

import type { ChatStatus } from "ai";
import {
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CopyIcon,
	Cpu,
	RefreshCwIcon,
	SquarePen,
	XIcon,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	Confirmation,
	ConfirmationAccepted,
	ConfirmationAction,
	ConfirmationActions,
	ConfirmationRejected,
	ConfirmationRequest,
	ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import {
	Message,
	MessageAttachment,
	MessageAttachments,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
	Source,
	Sources,
	SourcesContent,
	SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { useModels } from "@/hooks/use-models";
import type { UIMessage } from "@/types/chat";
import { ProviderLogo } from "../icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export type MessageRendererProps = {
	message: UIMessage;
	isLastMessage: boolean;
	status: ChatStatus;
	onRegenerate: () => void;
	onToolApproval?: (params: {
		id: string;
		approved: boolean;
		reason?: string;
	}) => void;
	// Branching props
	siblingCount?: number;
	siblingIndex?: number;
	onBranchChange?: (newIndex: number) => void;
	onEditUserMessage?: (newText: string) => void;
};

export function MessageRenderer({
	message,
	isLastMessage,
	status,
	onRegenerate,
	onToolApproval,
	siblingCount = 1,
	siblingIndex = 0,
	onBranchChange,
	onEditUserMessage,
}: MessageRendererProps) {
	const [copied, setCopied] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const editTextRef = useRef<HTMLTextAreaElement>(null);
	const { getModel } = useModels();
	const modelInfo = useMemo(
		() =>
			message.metadata?.modelId
				? getModel(message.metadata.modelId)
				: undefined,
		[message, getModel],
	);

	const handleCopy = useCallback(async () => {
		const textParts = message.parts
			.filter((p) => p.type === "text")
			.map((p: { type: string; text?: string }) => p.text)
			.join("\n");
		await navigator.clipboard.writeText(textParts);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [message.parts]);

	const handleEditSubmit = useCallback(() => {
		const newText = editTextRef.current?.value?.trim();
		if (newText && onEditUserMessage) {
			onEditUserMessage(newText);
			setIsEditing(false);
		}
	}, [onEditUserMessage]);

	const handleEditCancel = useCallback(() => {
		setIsEditing(false);
	}, []);

	const handleEditStart = useCallback(() => {
		setIsEditing(true);
	}, []);

	// Extract sources from message parts
	const sources = message.parts.filter(
		(p): p is Extract<typeof p, { type: "source-url" }> =>
			p.type === "source-url",
	);

	// Extract file attachments from message parts
	const fileAttachments = message.parts.filter(
		(p): p is Extract<typeof p, { type: "file" }> => p.type === "file",
	);

	// Get current message text for editing
	const messageText = useMemo(() => {
		return message.parts
			.filter((p) => p.type === "text")
			.map((p: { type: string; text?: string }) => p.text ?? "")
			.join("\n");
	}, [message.parts]);

	// Branch navigation UI
	const branchSelector =
		siblingCount > 1 ? (
			<div className="flex items-center gap-0.5">
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6"
					onClick={() =>
						onBranchChange?.(
							siblingIndex > 0 ? siblingIndex - 1 : siblingCount - 1,
						)
					}
				>
					<ChevronLeftIcon className="h-3 w-3" />
				</Button>
				<span className="text-xs text-muted-foreground tabular-nums min-w-[2rem] text-center">
					{siblingIndex + 1}/{siblingCount}
				</span>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6"
					onClick={() =>
						onBranchChange?.(
							siblingIndex < siblingCount - 1 ? siblingIndex + 1 : 0,
						)
					}
				>
					<ChevronRightIcon className="h-3 w-3" />
				</Button>
			</div>
		) : null;

	return (
		<Message className="group" from={message.role} key={message.id}>
			{/* Render file attachments before content */}
			{fileAttachments.length > 0 && (
				<MessageAttachments className="mb-2">
					{fileAttachments.map((file) => (
						<MessageAttachment data={file} key={file.url} />
					))}
				</MessageAttachments>
			)}

			{/* User message editing */}
			{isEditing && message.role === "user" ? (
				<div className="ml-auto w-full max-w-[80%] space-y-2">
					<textarea
						ref={editTextRef}
						defaultValue={messageText}
						className="w-full rounded-lg border bg-secondary px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
						rows={Math.min(10, messageText.split("\n").length + 1)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
								handleEditSubmit();
							}
							if (e.key === "Escape") {
								handleEditCancel();
							}
						}}
					/>
					<div className="flex justify-end gap-2">
						<Button variant="ghost" size="sm" onClick={handleEditCancel}>
							<XIcon className="h-3 w-3 mr-1" />
							Cancel
						</Button>
						<Button size="sm" onClick={handleEditSubmit}>
							<CheckIcon className="h-3 w-3 mr-1" />
							Submit
						</Button>
					</div>
				</div>
			) : (
				<MessageContent>
					{message.parts.map((part, partIndex) => {
						const isStreaming =
							status === "streaming" &&
							isLastMessage &&
							partIndex === message.parts.length - 1;

						switch (part.type) {
							case "text":
								return (
									<MessageResponse key={partIndex}>{part.text}</MessageResponse>
								);

							case "reasoning":
								return (
									<Reasoning
										defaultOpen={false}
										key={partIndex}
										isStreaming={isStreaming}
									>
										<ReasoningTrigger />
										<ReasoningContent>{part.text}</ReasoningContent>
									</Reasoning>
								);

							case "dynamic-tool":
							// case "tool-${string}"
							case part.type.startsWith("tool-") ? part.type : null: {
								// Type guard for tool call
								if (!("toolCallId" in part)) return null;

								return (
									<Tool key={partIndex} className="overflow-hidden">
										<ToolHeader
											title={
												"toolName" in part
													? part.toolName
													: part.type.startsWith("tool-")
														? part.type.slice(5)
														: "Tool"
											}
											type="tool-call"
											state={part.state}
										/>
										<ToolContent>
											<ToolInput input={JSON.stringify(part.input, null, 2)} />

											{/* Approval UI */}
											<Confirmation approval={part.approval} state={part.state}>
												<ConfirmationRequest>
													<ConfirmationTitle>
														This tool requires approval to execute
													</ConfirmationTitle>
													<ConfirmationActions>
														<ConfirmationAction
															onClick={() => {
																if (part.approval?.id)
																	onToolApproval?.({
																		id: part.approval?.id,
																		approved: true,
																	});
															}}
														>
															Approve
														</ConfirmationAction>
														<ConfirmationAction
															variant="outline"
															onClick={() => {
																if (part.approval?.id)
																	onToolApproval?.({
																		id: part.approval?.id,
																		approved: false,
																		reason: "User rejected",
																	});
															}}
														>
															Reject
														</ConfirmationAction>
													</ConfirmationActions>
												</ConfirmationRequest>

												<ConfirmationAccepted>
													Tool execution approved
												</ConfirmationAccepted>

												<ConfirmationRejected>
													Tool execution rejected
												</ConfirmationRejected>
											</Confirmation>

											{/* Existing output rendering */}
											{part.state === "output-available" && (
												<ToolOutput
													output={JSON.stringify(part.output, null, 2)}
													errorText={part.errorText}
												/>
											)}
											{part.state === "output-error" && (
												<ToolOutput
													output={part.output}
													errorText={part.errorText || "Unknown error"}
												/>
											)}
										</ToolContent>
									</Tool>
								);
							}

							case "file":
								// Files are rendered separately via MessageAttachments
								return null;

							case "source-url":
								// Sources are rendered separately below
								return null;

							default:
								return null;
						}
					})}

					{/* Render sources if any */}
					{sources.length > 0 && (
						<Sources>
							<SourcesTrigger count={sources.length} />
							<SourcesContent>
								{sources.map((source, idx) => (
									<Source key={idx} href={source.url} title={source.url} />
								))}
							</SourcesContent>
						</Sources>
					)}
				</MessageContent>
			)}

			{/* User message actions */}
			{message.role === "user" &&
				!isEditing &&
				(status !== "streaming" || !isLastMessage) && (
					<div className="mt-1 flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
						{branchSelector}
						{onEditUserMessage && (
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={handleEditStart}
									>
										<SquarePen className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Edit</TooltipContent>
							</Tooltip>
						)}
					</div>
				)}

			{/* Assistant message actions */}
			{message.role === "assistant" &&
				(status !== "streaming" || !isLastMessage) && (
					<div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						{branchSelector}
						<Tooltip>
							<TooltipTrigger>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={handleCopy}
									title="Copy message"
								>
									{copied ? (
										<CheckIcon className="h-4 w-4" />
									) : (
										<CopyIcon className="h-4 w-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={onRegenerate}
									title="Regenerate"
								>
									<RefreshCwIcon className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Retry</TooltipContent>
						</Tooltip>
						<div className="flex items-center gap-2.5 ml-2">
							{modelInfo && (
								<div className="flex items-center gap-2">
									<ProviderLogo provider={modelInfo.provider} size={14} />
									<p className="text-muted-foreground text-xs">
										{modelInfo.name}
									</p>
								</div>
							)}
							{!!message.metadata?.messageTokens && (
								<div className="flex items-center gap-1">
									<Cpu className="h-3 w-3 text-muted-foreground" />
									<p className="text-muted-foreground text-xs">
										{new Intl.NumberFormat("en-US", {
											notation: "compact",
										}).format(message.metadata.messageTokens)}
										&nbsp;Tokens
									</p>
								</div>
							)}
							{!!message.metadata?.cost?.totalUSD && (
								<div className="flex items-center gap-1">
									<p className="text-muted-foreground text-xs">
										${message.metadata.cost.totalUSD.toFixed(4)}
									</p>
								</div>
							)}
						</div>
					</div>
				)}
		</Message>
	);
}
