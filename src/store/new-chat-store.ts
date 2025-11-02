import { create } from "zustand";

interface NewChatStore {
	selectedServerIds: string[];
	addServer: (serverId: string) => void;
	removeServer: (serverId: string) => void;
	clearServers: () => void;
	setServers: (serverIds: string[]) => void;
}

/**
 * Store for managing MCP servers for new chats (before they're created).
 * This allows users to select servers on the /chat page, then persist
 * them to the database after the chat is created.
 */
export const useNewChatStore = create<NewChatStore>((set) => ({
	selectedServerIds: [],

	addServer: (serverId: string) =>
		set((state) => {
			if (state.selectedServerIds.includes(serverId)) {
				return state;
			}
			return {
				selectedServerIds: [...state.selectedServerIds, serverId],
			};
		}),

	removeServer: (serverId: string) =>
		set((state) => ({
			selectedServerIds: state.selectedServerIds.filter(
				(id) => id !== serverId,
			),
		})),

	clearServers: () =>
		set({
			selectedServerIds: [],
		}),

	setServers: (serverIds: string[]) =>
		set({
			selectedServerIds: serverIds,
		}),
}));
