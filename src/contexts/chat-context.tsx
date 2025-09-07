import { LLMProvider } from "@/types/models";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useLocalStorage } from "usehooks-ts";

interface ChatContextType {
	selectedModel: string;
	selectedProvider: LLMProvider;
	setSelectedModel: (model: string, provider: LLMProvider) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
	const [selectedModel, setSelectedModelState] = useLocalStorage<string>(
		"remotemcp:model",
		"",
	);
	const [selectedProvider, setSelectedProviderState] =
		useLocalStorage<LLMProvider>("remotemcp:provider", LLMProvider.OPENAI);

	const setSelectedModel = (model: string, provider: LLMProvider) => {
		setSelectedModelState(model);
		setSelectedProviderState(provider);
	};

	return (
		<ChatContext.Provider
			value={{
				selectedModel,
				selectedProvider,
				setSelectedModel,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
}

export function useChatContext() {
	const context = useContext(ChatContext);
	if (context === undefined) {
		throw new Error("useChatContext must be used within a ChatProvider");
	}
	return context;
}
