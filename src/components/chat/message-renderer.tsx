"use client";

import type { ChatStatus, UIMessage } from "ai";
import { CheckIcon, CopyIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useState } from "react";
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
};

export function MessageRenderer({
	message,
	isLastMessage,
	status,
	onRegenerate,
	onToolApproval,
}: MessageRendererProps) {
	console.log("🚀 ~ MessageRenderer ~ message:", message);
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		const textParts = message.parts
			.filter((p) => p.type === "text")
			.map((p: { type: string; text?: string }) => p.text)
			.join("\n");
		await navigator.clipboard.writeText(textParts);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [message.parts]);

	// Extract sources from message parts
	const sources = message.parts.filter(
		(p): p is Extract<typeof p, { type: "source-url" }> =>
			p.type === "source-url",
	);

	// Extract file attachments from message parts
	const fileAttachments = message.parts.filter(
		(p): p is Extract<typeof p, { type: "file" }> => p.type === "file",
	);

	return (
		<Message from={message.role} key={message.id}>
			{/* Render file attachments before content */}
			{fileAttachments.length > 0 && (
				<MessageAttachments className="mb-2">
					{fileAttachments.map((file) => (
						<MessageAttachment data={file} key={file.url} />
					))}
				</MessageAttachments>
			)}

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

			{/* Message Actions (only for assistant messages) */}
			{message.role === "assistant" && (
				<div className="mt-2 flex items-center gap-1">
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
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={onRegenerate}
						title="Regenerate"
					>
						<RefreshCwIcon className="h-4 w-4" />
					</Button>
				</div>
			)}
		</Message>
	);
}
