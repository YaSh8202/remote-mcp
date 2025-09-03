import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";

import { Thread } from "@/components/assistant-ui/thread";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatSettings } from "@/components/chat-settings";
import { trpc } from "@/integrations/trpc/react";

const chatSearchSchema = z.object({
	provider: z.string().optional(),
});

export const Route = createFileRoute("/_authed/chat/$id")({
	component: ChatPage,
	validateSearch: chatSearchSchema,
});

function ChatPage() {
	const { id } = Route.useParams();
	const { provider } = Route.useSearch();
	const [chatSettings, setChatSettings] = useState({
		llmProviderId: undefined as string | undefined,
		systemPrompt: undefined as string | undefined,
		mcpServerIds: [] as string[],
	});

	// Fetch chat details
	const { data: chat } = trpc.chat.getChatById.useQuery({ chatId: id });

	// Using AI SDK v5 with useChatRuntime hook and custom transport
	const runtime = useChatRuntime({
		transport: new AssistantChatTransport({
			api: `/api/chat/${id}`,
			body: {
				providerId: chatSettings.llmProviderId || provider,
			},
		}),
	});

	const handleSettingsUpdate = (updates: {
		llmProviderId?: string;
		systemPrompt?: string;
		mcpServerIds?: string[];
	}) => {
		setChatSettings(prev => ({ ...prev, ...updates }));
	};

	return (
		<div className="flex h-full">
			<ChatSidebar currentChatId={id} />
			<div className="flex-1 flex flex-col">
				<div className="flex items-center justify-between p-4 border-b">
					<h1 className="text-lg font-semibold">
						{chat?.title || "Chat"}
					</h1>
					<ChatSettings
						chatId={id}
						currentProviderId={chat?.llmProviderId || undefined}
						systemPrompt={chat?.systemPrompt || undefined}
						mcpServerIds={chat?.mcpServerIds || []}
						onUpdate={handleSettingsUpdate}
					/>
				</div>
				<div className="flex-1">
					<AssistantRuntimeProvider runtime={runtime}>
						<Thread />
					</AssistantRuntimeProvider>
				</div>
			</div>
		</div>
	);
}