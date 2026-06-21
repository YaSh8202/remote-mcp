import { isToolUIPart } from "ai";
import type { UIMessage } from "@/types/chat";

/**
 * Separator @mastra/ai-sdk uses to encode `${runId}::${toolCallId}` into a tool
 * approval id. The server splits on it to recover the runId for resumeStream.
 */
const APPROVAL_ID_SEPARATOR = "::";

export type ExtractedApproval = {
	resumeData: { approved: boolean; reason?: string };
	runId: string;
};

/**
 * Re-implementation of @mastra/ai-sdk's (un-exported) extractV6NativeApproval.
 *
 * Scans an assistant message for the most recent `approval-responded` tool part
 * and recovers the runId encoded in its approval id, so the suspended agent run
 * can be resumed. Returns null for a normal (non-approval) message.
 *
 * The app's frontend sends only the latest message, so this is called on the
 * incoming assistant message produced by AI SDK's `addToolApprovalResponse`.
 */
export function extractApproval(
	message: UIMessage | undefined,
): ExtractedApproval | null {
	if (!message || message.role !== "assistant") return null;
	const parts = message.parts ?? [];
	for (let i = parts.length - 1; i >= 0; i--) {
		const part = parts[i];
		if (!isToolUIPart(part)) continue;
		// `approval-responded` carries the user's decision (approved/reason).
		const toolPart = part as unknown as {
			state?: string;
			approval?: { id?: string; approved?: boolean; reason?: string };
		};
		if (toolPart.state !== "approval-responded") continue;
		const id = toolPart.approval?.id;
		if (!id) continue;
		const sep = id.lastIndexOf(APPROVAL_ID_SEPARATOR);
		if (sep === -1) continue;
		const runId = id.slice(0, sep);
		if (!runId) continue;
		return {
			resumeData: {
				approved: Boolean(toolPart.approval?.approved),
				...(toolPart.approval?.reason != null
					? { reason: toolPart.approval.reason }
					: {}),
			},
			runId,
		};
	}
	return null;
}
