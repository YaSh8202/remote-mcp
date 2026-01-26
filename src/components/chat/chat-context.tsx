import { useChatMessages } from "@ai-sdk-tools/store";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useMcpServerListTools } from "@/hooks/query-hooks/use-mcp-server-list-tools";
import { useTRPC } from "@/integrations/trpc/react";
import { countToolTokens } from "@/lib/chat-utils";
import type { ToolDescription } from "@/services/mcp-server";
import { useChatModel } from "@/store/chat-store";
import type { UIMessage } from "@/types/chat";
import {
	Context,
	ContextContent,
	ContextContentBody,
	ContextContentFooter,
	ContextContentHeader,
	ContextMessagesUsage,
	ContextToolUsage,
	ContextTrigger,
} from "../ai-elements/context";

function ChatContext({ chatId }: { chatId: string }) {
	const chatModel = useChatModel();
	const messages = useChatMessages<UIMessage>();
	const trpc = useTRPC();

	// Query MCP servers for the chat
	const { data: mcpServers } = useQuery(
		trpc.chat.listMcpServers.queryOptions({
			chatId,
		}),
	);

	// Build selected servers configuration for tool fetching
	const selectedServers = useMemo(() => {
		return (
			mcpServers
				?.map((serverData) => {
					const { chatMcpServer, mcpServerData } = serverData;
					if (chatMcpServer.isRemoteMcp && mcpServerData) {
						return {
							id: chatMcpServer.id,
							isRemoteMcp: true as const,
							mcpServerId: mcpServerData.id,
							tools: chatMcpServer.tools || [],
							includeAllTools: chatMcpServer.includeAllTools,
						};
					}
					if (
						!chatMcpServer.isRemoteMcp &&
						chatMcpServer.config?.url &&
						chatMcpServer.config?.type &&
						chatMcpServer.displayName
					) {
						return {
							id: chatMcpServer.id,
							config: {
								url: chatMcpServer.config.url,
								type: chatMcpServer.config.type as "http" | "sse",
								headers: chatMcpServer.config.headers,
							},
							displayName: chatMcpServer.displayName,
							isRemoteMcp: false as const,
							tools: chatMcpServer.tools || [],
							includeAllTools: chatMcpServer.includeAllTools,
						};
					}
					return null;
				})
				.filter(
					(server): server is NonNullable<typeof server> => server !== null,
				) || []
		);
	}, [mcpServers]);

	// Fetch tools from MCP servers
	const { data: mcpServerTools } = useMcpServerListTools({
		mcpServers: selectedServers,
	});

	// Calculate tool tokens from all available tools
	// const toolTokens = useMemo(() => {
	//   if (!mcpServerTools) return 0;
	//   return mcpServerTools.reduce((total, server) => {
	//     return (
	//       total +
	//       server.tools.reduce((serverTotal, tool) => {
	//         return serverTotal + countToolTokens(tool);
	//       }, 0)
	//     );
	//   }, 0);
	// }, [mcpServerTools]);

	// Calculate tool tokens from selected tools only
	const toolTokens = useMemo(() => {
		if (!mcpServerTools) return 0;
		return selectedServers.reduce((total, server) => {
			const selection = {
				tools: server.tools,
				includeAllTools: server.includeAllTools,
			};

			if (selection.includeAllTools) {
				const serverInfo = (
					mcpServerTools as Array<{
						name: string;
						tools: ToolDescription[];
					}>
				).find((s) =>
					server.isRemoteMcp
						? s.name ===
							mcpServers?.find(
								(ms) =>
									ms.chatMcpServer.isRemoteMcp &&
									ms.mcpServerData?.id === server.mcpServerId,
							)?.mcpServerData?.name
						: s.name === server.displayName,
				);
				if (!serverInfo) return total;
				return (
					total +
					serverInfo.tools.reduce((serverTotal, tool) => {
						return serverTotal + countToolTokens(tool);
					}, 0)
				);
			}

			return (
				total +
				selection.tools.reduce((serverTotal, toolName) => {
					const serverInfo = (
						mcpServerTools as Array<{
							name: string;
							tools: ToolDescription[];
						}>
					).find((s) =>
						server.isRemoteMcp
							? s.name ===
								mcpServers?.find(
									(ms) =>
										ms.chatMcpServer.isRemoteMcp &&
										ms.mcpServerData?.id === server.mcpServerId,
								)?.mcpServerData?.name
							: s.name === server.displayName,
					);
					if (!serverInfo) return serverTotal;
					const tool = serverInfo.tools.find((t) => t.name === toolName);
					if (!tool) return serverTotal;
					return serverTotal + countToolTokens(tool);
				}, 0)
			);
		}, 0);
	}, [mcpServerTools, selectedServers, mcpServers]);

	if (!chatModel) {
		return null;
	}

	return (
		<Context
			maxTokens={chatModel.limit?.context ?? 128_000}
			modelId={chatModel?.fullId}
			messageTokens={messages.reduce(
				(total, msg) =>
					total +
					(msg.metadata?.messageTokens ? msg.metadata.messageTokens : 0),
				0,
			)}
			toolTokens={toolTokens}
			totalCostUSD={messages
				.filter((m) => m.role === "assistant")
				.reduce(
					(total, msg) =>
						total +
						(msg.metadata?.cost?.totalUSD ? msg.metadata.cost.totalUSD : 0),
					0,
				)}
		>
			<ContextTrigger />
			<ContextContent>
				<ContextContentHeader />
				<ContextContentBody className="space-y-1.5">
					<ContextMessagesUsage />
					<ContextToolUsage />
				</ContextContentBody>
				<ContextContentFooter />
			</ContextContent>
		</Context>
	);
}

export default ChatContext;
