import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useMcpServerListTools } from "@/hooks/query-hooks/use-mcp-server-list-tools";
import { useTRPC } from "@/integrations/trpc/react";

export const useChatTools = (chatId: string) => {
	const trpc = useTRPC();

	const { data: mcpServers } = useSuspenseQuery({
		enabled: !!chatId,
		...trpc.chat.listMcpServers.queryOptions({
			chatId: chatId,
		}),
	});

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

	const { data, isLoading } = useMcpServerListTools({
		mcpServers: selectedServers,
	});

	return {
		data,
		isLoading,
		selectedServers,
	};
};
