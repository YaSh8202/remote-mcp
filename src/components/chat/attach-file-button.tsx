import { PaperclipIcon } from "lucide-react";
import {
	PromptInputButton,
	usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";

export function AttachFileButton({ disabled }: { disabled?: boolean }) {
	const attachments = usePromptInputAttachments();

	return (
		<PromptInputButton
			onClick={() => attachments.openFileDialog()}
			title="Attach files"
			disabled={disabled}
		>
			<PaperclipIcon className="size-4" />
		</PromptInputButton>
	);
}
