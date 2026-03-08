import type { UIMessage } from "@/types/chat";

/**
 * Branching + inline edit helpers.
 *
 * Each message points to its parent via `metadata.parentId`.
 * Branches are multiple children under the same parent.
 */

export const ROOT_PARENT_ID: null = null;
export const ROOT_PARENT_KEY = "__root__" as const;

export type ParentId = string | null;

export function parentKeyFromParentId(parentId: ParentId): string {
	return parentId === null ? ROOT_PARENT_KEY : parentId;
}

export function getParentId(message: UIMessage): ParentId | undefined {
	return message.metadata?.parentId;
}

export function getEditedFromId(message: UIMessage): string | undefined {
	return message.metadata?.editedFromId;
}

export function withBranchingMetadata(
	message: UIMessage,
	next: { parentId?: ParentId; editedFromId?: string },
): UIMessage {
	return {
		...message,
		metadata: {
			...message.metadata,
			...next,
		},
	} as UIMessage;
}

export type ChildrenByParentKey = Map<string, UIMessage[]>;

export function buildChildrenByParentKey(
	messages: UIMessage[],
): ChildrenByParentKey {
	const map: ChildrenByParentKey = new Map();
	for (const m of messages) {
		const parentId = getParentId(m) ?? ROOT_PARENT_ID;
		const key = parentKeyFromParentId(parentId);
		const existing = map.get(key);
		if (existing) {
			existing.push(m);
		} else {
			map.set(key, [m]);
		}
	}
	return map;
}

export type BranchSelectionByParentKey = Record<string, number | undefined>;

export function getSelectedChildIndex(
	selection: BranchSelectionByParentKey | undefined,
	parentKey: string,
	childCount: number,
): number {
	if (childCount <= 0) return 0;
	const raw = selection?.[parentKey];
	const idx =
		typeof raw === "number" && Number.isFinite(raw) ? raw : childCount - 1;
	return Math.max(0, Math.min(childCount - 1, idx));
}

export function deriveVisiblePath(
	messages: UIMessage[],
	selection?: BranchSelectionByParentKey,
): UIMessage[] {
	const childrenByParentKey = buildChildrenByParentKey(messages);
	const out: UIMessage[] = [];

	let parentKey: string = ROOT_PARENT_KEY;
	const seen = new Set<string>();

	while (true) {
		const children = childrenByParentKey.get(parentKey);
		if (!children || children.length === 0) break;

		const idx = getSelectedChildIndex(selection, parentKey, children.length);
		const next = children[idx];
		if (!next) break;

		if (seen.has(next.id)) break;
		seen.add(next.id);

		out.push(next);
		parentKey = next.id;
	}

	return out;
}

export function getSiblingsForMessage(
	messages: UIMessage[],
	message: UIMessage,
): { parentKey: string; siblings: UIMessage[]; index: number } {
	const parentId = getParentId(message) ?? ROOT_PARENT_ID;
	const parentKey = parentKeyFromParentId(parentId);
	const siblings = buildChildrenByParentKey(messages).get(parentKey) ?? [
		message,
	];
	const index = Math.max(
		0,
		siblings.findIndex((m) => m.id === message.id),
	);
	return { parentKey, siblings, index };
}

export function mergeMessagesById(
	base: UIMessage[],
	incoming: UIMessage[],
): UIMessage[] {
	const byId = new Map<string, UIMessage>();
	for (const m of base) {
		if (m?.id) byId.set(m.id, m);
	}
	for (const m of incoming) {
		if (m?.id) byId.set(m.id, m);
	}

	const out: UIMessage[] = [];
	const seen = new Set<string>();

	for (const m of base) {
		const next = m?.id ? byId.get(m.id) : undefined;
		if (next && !seen.has(next.id)) {
			out.push(next);
			seen.add(next.id);
		}
	}
	for (const m of incoming) {
		const next = m?.id ? byId.get(m.id) : undefined;
		if (next && !seen.has(next.id)) {
			out.push(next);
			seen.add(next.id);
		}
	}

	return out;
}

/**
 * Builds a linear path from root to the given leaf message by walking parentId pointers.
 * Used server-side to construct the prompt for LLM generation.
 */
export function buildPathEndingAt(
	messages: UIMessage[],
	leafId: string,
): UIMessage[] {
	const byId = new Map<string, UIMessage>();
	for (const m of messages) {
		byId.set(m.id, m);
	}

	const path: UIMessage[] = [];
	let current = byId.get(leafId);

	const seen = new Set<string>();
	while (current) {
		if (seen.has(current.id)) break;
		seen.add(current.id);
		path.unshift(current);
		const pid = getParentId(current);
		if (pid === null || pid === undefined) break;
		current = byId.get(pid);
	}

	return path;
}

/**
 * Infers parentId for legacy messages that don't have one set.
 * Assumes messages are in chronological order - each message parents to the previous.
 */
export function ensureParentIds(messages: UIMessage[]): UIMessage[] {
	// If any message has a string parentId, the chat uses branching —
	// preserve null parentIds as explicit root markers.
	// Otherwise it's a legacy chat where all parentIds are null and need inference.
	const hasBranching = messages.some(
		(msg) => typeof msg.metadata?.parentId === "string",
	);
	return messages.map((msg, i) => {
		const existing = msg.metadata?.parentId;
		// Skip if parentId is already a valid string reference
		if (typeof existing === "string") return msg;
		// In branching chats, null means explicitly root — preserve it
		if (hasBranching && existing === null) return msg;
		// For legacy messages or those with undefined parentId, infer from order
		const parentId = i === 0 ? null : messages[i - 1].id;
		return {
			...msg,
			metadata: {
				...msg.metadata,
				parentId,
			},
		} as UIMessage;
	});
}
