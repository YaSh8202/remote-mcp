import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import type { UIMessage } from "ai";

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
	// Create runtime
	const runtime = useChatRuntime({
		transport: new AssistantChatTransport({
			api: "/api/chat",
			body: chatId ? { chatId } : {},
		}),
		messages: messages,
		id: chatId,
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			{children}
		</AssistantRuntimeProvider>
	);
}
