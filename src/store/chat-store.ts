import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LLMProvider } from "@/types/models";

interface ChatStore {
	selectedModel: string;
	selectedProvider: LLMProvider;
	setSelectedModel: (model: string, provider: LLMProvider) => void;
}

// Custom storage that maintains backward compatibility with the original localStorage keys
const customStorage = createJSONStorage(() => ({
	getItem: (name: string) => {
		// Try to get from new format first
		const newFormatValue = localStorage.getItem(name);
		if (newFormatValue) return newFormatValue;

		// Fall back to old format
		const modelValue = localStorage.getItem("remotemcp:model");
		const providerValue = localStorage.getItem("remotemcp:provider");

		if (!modelValue && !providerValue) return null;

		return JSON.stringify({
			state: {
				selectedModel: modelValue ? JSON.parse(modelValue) : "",
				selectedProvider: providerValue
					? JSON.parse(providerValue)
					: LLMProvider.OPENAI,
			},
			version: 0,
		});
	},
	setItem: (name: string, value: string) => {
		// Store in new format
		localStorage.setItem(name, value);

		// Also maintain the old format for compatibility
		try {
			const parsed = JSON.parse(value);
			if (parsed.state) {
				localStorage.setItem(
					"remotemcp:model",
					JSON.stringify(parsed.state.selectedModel),
				);
				localStorage.setItem(
					"remotemcp:provider",
					JSON.stringify(parsed.state.selectedProvider),
				);
			}
		} catch (_e) {
			// If parsing fails, just store in new format
		}
	},
	removeItem: (name: string) => {
		localStorage.removeItem(name);
		localStorage.removeItem("remotemcp:model");
		localStorage.removeItem("remotemcp:provider");
	},
}));

export const useChatStore = create<ChatStore>()(
	persist(
		(set) => ({
			selectedModel: "",
			selectedProvider: LLMProvider.OPENAI,
			setSelectedModel: (model: string, provider: LLMProvider) =>
				set({ selectedModel: model, selectedProvider: provider }),
		}),
		{
			name: "remotemcp:chat",
			storage: customStorage,
		},
	),
);
