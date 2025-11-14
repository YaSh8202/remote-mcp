"use client";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { useChatContext } from "@/contexts/chat-context";
import { ArrowUpIcon, PlusIcon, Square, XIcon } from "lucide-react";
import {
	type ChangeEvent,
	type FormEvent,
	type KeyboardEvent,
	type ReactNode,
	useCallback,
	useRef,
	useState,
} from "react";

interface FileAttachment {
	file: File;
	preview?: string;
}

interface PromptInputProps {
	disabled?: boolean;
	placeholder?: string;
	children?: ReactNode;
	onSubmit?: (input: string, files: File[]) => void;
}

export function PromptInput({
	disabled = false,
	placeholder = "Send a message...",
	children,
	onSubmit: onSubmitProp,
}: PromptInputProps) {
	const { input, setInput, handleSubmit, isLoading, stop } = useChatContext();
	const [attachments, setAttachments] = useState<FileAttachment[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize textarea
	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			const newHeight = Math.min(textarea.scrollHeight, 128); // max-h-32
			textarea.style.height = `${newHeight}px`;
		}
	}, []);

	const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
		adjustTextareaHeight();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (input.trim() || attachments.length > 0) {
				handleFormSubmit(e as unknown as FormEvent<HTMLFormElement>);
			}
		}
	};

	const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (disabled || (!input.trim() && attachments.length === 0)) return;

		const files = attachments.map((a) => a.file);

		// Custom submit handler if provided
		if (onSubmitProp) {
			onSubmitProp(input, files);
		} else {
			// Use default handleSubmit from context
			handleSubmit(e, {
				experimental_attachments: files,
			});
		}

		// Clear attachments after submit
		setAttachments([]);

		// Reset textarea height
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	};

	const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);

		const newAttachments = files.map((file) => {
			const attachment: FileAttachment = { file };

			// Create preview for images
			if (file.type.startsWith("image/")) {
				const reader = new FileReader();
				reader.onload = (event) => {
					attachment.preview = event.target?.result as string;
					setAttachments((prev) =>
						prev.map((a) => (a.file === file ? attachment : a)),
					);
				};
				reader.readAsDataURL(file);
			}

			return attachment;
		});

		setAttachments((prev) => [...prev, ...newAttachments]);

		// Reset file input
		if (e.target) {
			e.target.value = "";
		}
	}, []);

	const removeAttachment = (index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<form
			onSubmit={handleFormSubmit}
			className="relative flex w-full flex-col rounded-3xl border border-border bg-muted px-1 pt-2 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),0_2px_5px_0px_rgba(0,0,0,0.06)] dark:border-muted-foreground/15"
		>
			{/* Attachments preview */}
			{attachments.length > 0 && (
				<div className="mb-2 flex w-full flex-row items-center gap-2 overflow-x-auto px-1.5 pt-0.5 pb-1">
					{attachments.map((attachment, index) => (
						<AttachmentPreview
							key={index}
							attachment={attachment}
							onRemove={() => removeAttachment(index)}
						/>
					))}
				</div>
			)}

			{/* Input area */}
			<textarea
				ref={textareaRef}
				value={input}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled}
				rows={1}
				className="mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-base outline-none placeholder:text-muted-foreground focus:outline-primary"
				aria-label="Message input"
			/>

			{/* Action bar */}
			<div className="relative mx-1 mt-2 mb-2 flex items-center justify-between">
				<div className="flex items-center gap-0.5">
					{/* Add attachment button */}
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept="image/*,.pdf,.doc,.docx,.txt"
						onChange={handleFileSelect}
						className="hidden"
					/>
					<TooltipIconButton
						tooltip="Add Attachment"
						side="bottom"
						variant="ghost"
						size="icon"
						className="size-[34px] rounded-full p-1 text-xs font-semibold hover:bg-muted-foreground/15 dark:border-muted-foreground/15 dark:hover:bg-muted-foreground/30"
						onClick={() => fileInputRef.current?.click()}
						disabled={disabled}
						aria-label="Add Attachment"
					>
						<PlusIcon className="size-5 stroke-[1.5px]" />
					</TooltipIconButton>

					{/* Additional controls (passed as children) */}
					{children}
				</div>

				{/* Send/Stop button */}
				<div className="flex items-center gap-2">
					{isLoading ? (
						<Button
							type="button"
							variant="default"
							size="icon"
							className="size-[34px] rounded-full border border-muted-foreground/60 hover:bg-primary/75 dark:border-muted-foreground/90"
							onClick={stop}
							aria-label="Stop generating"
						>
							<Square className="size-3.5 fill-white dark:fill-black" />
						</Button>
					) : (
						<TooltipIconButton
							tooltip="Send message"
							side="bottom"
							type="submit"
							variant="default"
							size="icon"
							className="size-[34px] rounded-full p-1"
							disabled={disabled || (!input.trim() && attachments.length === 0)}
							aria-label="Send message"
						>
							<ArrowUpIcon className="size-5" />
						</TooltipIconButton>
					)}
				</div>
			</div>
		</form>
	);
}

interface AttachmentPreviewProps {
	attachment: FileAttachment;
	onRemove: () => void;
}

function AttachmentPreview({ attachment, onRemove }: AttachmentPreviewProps) {
	const isImage = attachment.file.type.startsWith("image/");

	return (
		<div className="relative size-14 overflow-hidden rounded-[14px] border border-foreground/20 bg-muted transition-opacity hover:opacity-75">
			{isImage && attachment.preview ? (
				<img
					src={attachment.preview}
					alt={attachment.file.name}
					className="size-full object-cover"
				/>
			) : (
				<div className="flex size-full items-center justify-center">
					<span className="text-xs text-muted-foreground">
						{attachment.file.name.split(".").pop()?.toUpperCase()}
					</span>
				</div>
			)}
			<button
				type="button"
				onClick={onRemove}
				className="absolute top-1.5 right-1.5 size-3.5 rounded-full bg-white text-muted-foreground opacity-100 shadow-sm hover:!bg-white hover:text-destructive"
				aria-label="Remove file"
			>
				<XIcon className="size-3 dark:stroke-[2.5px]" />
			</button>
		</div>
	);
}
