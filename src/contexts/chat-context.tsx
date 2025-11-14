"use client";

import { useModels } from "@/hooks/use-models";
import { useTRPC } from "@/integrations/trpc/react";
import { findModelById } from "@/lib/models";
import { useChatStore } from "@/store/chat-store";
import type { ChatRequestOptions, Message } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useRef } from "react";
import { toast } from "sonner";

interface ChatContextValue {
	messages: Message[];
	input: string;
	setInput: (input: string) => void;
	handleSubmit: (
		e: React.FormEvent<HTMLFormElement>,
		options?: ChatRequestOptions,
	) => void;
	isLoading: boolean;
	error: Error | undefined;
	stop: () => void;
	reload: () => void;
	append: (message: Message) => void;
	setMessages: (messages: Message[]) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChatContext must be used within ChatProvider");
	}
	return context;
}

interface ChatProviderProps {
	children: React.ReactNode;
	chatId: string;
	initialMessages?: Message[];
}

export function ChatProvider({
	children,
	chatId,
	initialMessages = [],
}: ChatProviderProps) {
	const { selectedModel, selectedProvider } = useChatStore();
	const modelsData = useModels();
	const queryClient = useQueryClient();
	const trpc = useTRPC();
	const isFirstMessageSendRef = useRef(false);

	const model = useMemo(() => {
		const modelInfo = findModelById(modelsData, selectedModel);
		return modelInfo?.id ?? selectedModel;
	}, [modelsData, selectedModel]);

	const chat = useChat({
		id: `${chatId}-${selectedProvider}-${model}`,
		api: `/api/chat/${chatId}`,
		initialMessages,
		body: {
			provider: selectedProvider,
			model,
		},
		onFinish: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.chat.getWithMessages.queryKey(),
			});
		},
		onError: (error) => {
			toast.error(`Error sending message: ${error.message}`);
		},
	});

	// Auto-send first pending message
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useMemo(() => {
		if (
			initialMessages.length === 1 &&
			!isFirstMessageSendRef.current &&
			initialMessages[0]?.role === "user"
		) {
			const message = initialMessages[0] as Message & {
				metadata?: { status: string };
			};
			if (message.metadata?.status === "pending") {
				// Use setTimeout to avoid state updates during render
				setTimeout(() => {
					chat.reload();
					isFirstMessageSendRef.current = true;
				}, 0);
			}
		}
	}, [initialMessages]);

	return (
		<ChatContext.Provider
			value={{
				messages: chat.messages,
				input: chat.input,
				setInput: chat.setInput,
				handleSubmit: chat.handleSubmit,
				isLoading: chat.isLoading,
				error: chat.error,
				stop: chat.stop,
				reload: chat.reload,
				append: chat.append,
				setMessages: chat.setMessages,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
}
