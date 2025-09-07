import { useModels } from "@/hooks/use-models";
import { useTRPC } from "@/integrations/trpc/react";
import { findModelById } from "@/lib/models";
import { useChatStore } from "@/store/chat-store";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { useMemo } from "react";

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
		return modelInfo?.meta.name ?? selectedModel;
	}, [modelsData, selectedModel]);

	const runtime = useChatRuntime({
		id: `${chatId}-${selectedProvider}-${model}`,
		transport: new AssistantChatTransport({
			prepareSendMessagesRequest: ({ id, messages }) => {
				return {
					body: {
						id,
						message: messages[messages.length - 1],
						provider: selectedProvider,
						model,
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
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			{children}
		</AssistantRuntimeProvider>
	);
}
