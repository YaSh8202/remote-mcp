import { useChat } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useAISDKRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useModels } from "@/hooks/use-models";
import { useTRPC } from "@/integrations/trpc/react";
import { compositeAdapter } from "@/lib/chat-adapters";
import { findModelById } from "@/lib/models";
import { useChatStore } from "@/store/chat-store";

interface ChatRuntimeProviderProps {
	children: React.ReactNode;
	chatId: string;
	messages: UIMessage[];
}

export function ChatRuntimeProvider({
	children,
	chatId,
	messages,
}: ChatRuntimeProviderProps) {
	const { selectedModel, selectedProvider } = useChatStore();
	const modelsData = useModels();
	const queryClient = useQueryClient();
	const trpc = useTRPC();

	const model = useMemo(() => {
		const modelInfo = findModelById(modelsData, selectedModel);
		return modelInfo?.id ?? selectedModel;
	}, [modelsData, selectedModel]);

	const chat = useChat({
		id: `${chatId}-${selectedProvider}-${model}`,
		transport: new AssistantChatTransport({
			prepareSendMessagesRequest: ({ messages, ...rest }) => {
				if (!model) {
					// toast.error("Please select a model before sending a message.");
					throw new Error("Model not selected");
				}

				return {
					body: {
						message: messages[messages.length - 1],
						provider: selectedProvider,
						model,
						...rest,
					},
				};
			},
			api: `/api/chat/${chatId}`,
		}),

		messages: messages,
		onFinish: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.chat.getWithMessages.queryKey(),
			});
		},
		onError: (error) => {
			toast.error(`Error sending message: ${error.message}`);
		},
	});

	const isFirstMessageSendRef = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: chat doesn't need to be in dep array
	useEffect(() => {
		if (messages.length !== 1 || isFirstMessageSendRef.current) return;
		const message = messages[0] as UIMessage<{ status: string }>;
		if (message.role === "user" && message.metadata?.status === "pending") {
			chat.sendMessage();
			isFirstMessageSendRef.current = true;
		}
	}, [messages]);

	const runtime = useAISDKRuntime(chat, {
		adapters: {
			attachments: compositeAdapter,
		},
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			{children}
		</AssistantRuntimeProvider>
	);
}
