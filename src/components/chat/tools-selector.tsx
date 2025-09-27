import { useTRPC } from "@/integrations/trpc/react";
import {
	type ToolDescription,
	mcpServerListTools,
} from "@/services/mcp-server";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { IconoirTools } from "../icons";
import { Button } from "../ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "../ui/sheet";
import { ToolsSelectionSheet } from "./tools-selection-sheet";

function ToolsSelector() {
	const { chatId } = useParams({
		from: "/_authed/chat/$chatId",
	});
	const [sheetOpen, setSheetOpen] = useState(false);
	const trpc = useTRPC();

	const { data: mcpServers } = useSuspenseQuery({
		enabled: chatId,
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

	const { data: mcpServerTools } = useQuery({
		queryKey: ["mcpServerListTools", selectedServers],
		queryFn: () =>
			mcpServerListTools({
				data: {
					servers: selectedServers,
				},
			}),
		enabled: selectedServers.length > 0,
	});

	const selectedToolsCount = useMemo(() => {
		if (!mcpServerTools || !selectedServers) return 0;

		return selectedServers.reduce((acc, server) => {
			if (server.includeAllTools) {
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
				return acc + (serverInfo ? serverInfo.tools.length : 0);
			}
			if (server.tools && server.tools.length > 0) {
				return acc + server.tools.length;
			}
			return acc;
		}, 0);
	}, [mcpServerTools, selectedServers, mcpServers]);

	return (
		<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" className="justify-between px-0">
					<div className="flex items-center gap-2 truncate">
						<span className="text-sm">
							<IconoirTools />
						</span>
						{selectedToolsCount} Tools
					</div>
					<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Server Tools Configuration</SheetTitle>
				</SheetHeader>
				<ToolsSelectionSheet
					chatId={chatId}
					mcpServers={mcpServers || []}
					onUpdate={() => {}}
				/>
			</SheetContent>
		</Sheet>
	);
}

export default ToolsSelector;
