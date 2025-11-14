import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { type ChatMcpServer, mcpServerListTools } from "@/services/mcp-server";

export const useMcpServerListToosl = ({
	mcpServers,
}: {
	mcpServers: ChatMcpServer[];
}) => {
	const getServerTools = useServerFn(mcpServerListTools);
	return useQuery({
		queryKey: ["mcpServerListTools", mcpServers.map((s) => s.id).sort()],
		queryFn: async () => {
			if (mcpServers.length === 0) {
				return [];
			}

			try {
				const result = await getServerTools({
					data: { servers: mcpServers },
				});
				return Array.isArray(result) ? result : [];
			} catch (error) {
				console.error("Failed to load server tools:", error);
				return [];
			}
		},
		enabled: mcpServers.length > 0,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: false, // Don't retry on errors to avoid spam
	});
};
