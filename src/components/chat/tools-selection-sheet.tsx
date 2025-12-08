import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ChatMcpServer, McpServer } from "@/db/schema";
import { useMcpServerListToosl } from "@/hooks/query-hooks/use-mcp-server-list-tools";
import { useTRPC } from "@/integrations/trpc/react";

interface ToolsSelectionSheetProps {
	chatId: string;
	mcpServers: Array<{
		chatMcpServer: ChatMcpServer;
		mcpServerData: McpServer | null;
	}>;
	onUpdate?: () => void;
}

interface ToolDescription {
	name: string;
	description?: string;
}

interface ServerTools {
	[serverKey: string]: ToolDescription[];
}

export function ToolsSelectionSheet({
	chatId,
	mcpServers,
	onUpdate,
}: ToolsSelectionSheetProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [expandedServers, setExpandedServers] = useState<Set<string>>(
		new Set(),
	);

	// Convert chat MCP servers to the format expected by mcpServerListTools
	const serversForToolsQuery = mcpServers
		.map((serverData) => {
			const { chatMcpServer, mcpServerData } = serverData;

			// Remote MCP server
			if (chatMcpServer.isRemoteMcp && mcpServerData?.id) {
				return {
					id: chatMcpServer.id,
					isRemoteMcp: true as const,
					mcpServerId: mcpServerData.id,
					tools: chatMcpServer.tools || [],
					includeAllTools: chatMcpServer.includeAllTools ?? false,
				};
			}

			// Direct connection MCP server
			if (
				!chatMcpServer.isRemoteMcp &&
				chatMcpServer.config?.url &&
				chatMcpServer.displayName &&
				typeof chatMcpServer.config.url === "string"
			) {
				return {
					id: chatMcpServer.id,
					isRemoteMcp: false as const,
					config: {
						url: chatMcpServer.config.url,
						type: (chatMcpServer.config.type || "http") as "http" | "sse",
						headers: chatMcpServer.config.headers || {},
					},
					displayName: chatMcpServer.displayName,
					tools: chatMcpServer.tools || [],
					includeAllTools: chatMcpServer.includeAllTools ?? false,
				};
			}

			return null;
		})
		.filter((server): server is NonNullable<typeof server> => server !== null);

	const { data: serverToolsData, isLoading: isLoadingTools } =
		useMcpServerListToosl({
			mcpServers: serversForToolsQuery,
		});

	// Convert server tools data to lookup map
	const serverTools: ServerTools = {};
	mcpServers.forEach((serverData, index) => {
		const serverKey =
			serverData.mcpServerData?.id || serverData.chatMcpServer.id;
		const toolsForServer = serverToolsData?.[index]?.tools || [];
		serverTools[serverKey] = toolsForServer;
	});

	// Mutation for updating MCP server tools with proper invalidation
	const updateMcpServerMutation = useMutation({
		...trpc.chat.updateMcpServer.mutationOptions(),
		onSuccess: () => {
			// Invalidate queries to ensure data consistency after successful mutation
			queryClient.invalidateQueries({
				queryKey: trpc.chat.listMcpServers.queryKey({
					chatId: chatId,
				}),
			});
			queryClient.invalidateQueries({
				queryKey: ["mcpServerListTools"],
			});
			// Invalidate tools selector query to update tool counts
			queryClient.invalidateQueries({
				queryKey: [
					"mcpServerListTools",
					mcpServers.map((s) => s.chatMcpServer.id).sort(),
				],
			});
			onUpdate?.();
		},
		onError: (error) => {
			console.error("Failed to update MCP server tools:", error);
		},
	});

	const toggleServerExpanded = (serverId: string) => {
		const newExpanded = new Set(expandedServers);
		if (newExpanded.has(serverId)) {
			newExpanded.delete(serverId);
		} else {
			newExpanded.add(serverId);
		}
		setExpandedServers(newExpanded);
	};

	const handleToolToggle = async (
		chatMcpServerId: string,
		toolName: string,
		currentTools: string[],
		includeAllTools: boolean,
	) => {
		let newTools: string[];
		let newIncludeAllTools = includeAllTools;

		if (includeAllTools) {
			// If all tools were selected, switch to selective mode and deselect this tool
			const serverKey =
				mcpServers.find((s) => s.chatMcpServer.id === chatMcpServerId)
					?.mcpServerData?.id ||
				mcpServers.find((s) => s.chatMcpServer.id === chatMcpServerId)
					?.chatMcpServer.id;
			const allToolNames = serverKey
				? (serverTools[serverKey] || []).map((tool) => tool.name)
				: [];
			newTools = allToolNames.filter((name) => name !== toolName);
			newIncludeAllTools = false;
		} else {
			// Toggle tool in selective mode
			if (currentTools.includes(toolName)) {
				newTools = currentTools.filter((name) => name !== toolName);
			} else {
				newTools = [...currentTools, toolName];
			}
		}

		// Use mutate for optimistic updates
		updateMcpServerMutation.mutateAsync({
			id: chatMcpServerId,
			tools: newTools,
			includeAllTools: newIncludeAllTools,
		});
	};

	const handleSelectAll = (chatMcpServerId: string) => {
		updateMcpServerMutation.mutateAsync({
			id: chatMcpServerId,
			tools: [],
			includeAllTools: true,
		});
	};

	const handleDeselectAll = (chatMcpServerId: string) => {
		updateMcpServerMutation.mutateAsync({
			id: chatMcpServerId,
			tools: [],
			includeAllTools: false,
		});
	};

	if (isLoadingTools && serversForToolsQuery.length > 0) {
		return (
			<div className="flex items-center justify-center h-[600px] w-full">
				<div className="flex items-center gap-2">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span>Loading tools...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 p-4 flex-1 overflow-y-auto">
			{mcpServers.map((serverData) => {
				const { chatMcpServer, mcpServerData } = serverData;
				const serverKey = mcpServerData?.id || chatMcpServer.id;
				const serverName =
					mcpServerData?.name || chatMcpServer.displayName || "Unknown Server";
				const isExpanded = expandedServers.has(serverKey);
				const tools = serverTools[serverKey] || [];
				const toolNames = tools.map((tool) => tool.name);
				const selectedTools = chatMcpServer.tools || [];
				const includeAllTools = chatMcpServer.includeAllTools ?? false;

				return (
					<div key={chatMcpServer.id} className="border rounded-lg p-4">
						<Collapsible
							open={isExpanded}
							onOpenChange={() => toggleServerExpanded(serverKey)}
						>
							<CollapsibleTrigger asChild>
								<div className="flex items-center justify-between w-full cursor-pointer">
									<div className="flex items-center gap-2">
										{isExpanded ? (
											<ChevronDown className="h-4 w-4" />
										) : (
											<ChevronRight className="h-4 w-4" />
										)}
										<h3 className="font-semibold">{serverName}</h3>
										<span className="text-sm text-muted-foreground">
											({toolNames.length} tools)
										</span>
									</div>
								</div>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-4">
								<div className="space-y-3">
									<div className="flex gap-2 items-center pb-1">
										<Checkbox
											onCheckedChange={(val) => {
												if (val) {
													handleSelectAll(chatMcpServer.id);
												} else {
													handleDeselectAll(chatMcpServer.id);
												}
											}}
											checked={
												includeAllTools ||
												(toolNames.length > 0 &&
													toolNames.every((toolName) =>
														selectedTools.includes(toolName),
													))
											}
											disabled={updateMcpServerMutation.isPending}
										/>
										Select All
									</div>
									<div className="space-y-2">
										{tools.map((tool) => {
											const isSelected =
												includeAllTools || selectedTools.includes(tool.name);

											return (
												<div
													key={tool.name}
													className="flex items-start gap-2 p-2 rounded "
												>
													<Checkbox
														checked={isSelected}
														onCheckedChange={() =>
															handleToolToggle(
																chatMcpServer.id,
																tool.name,
																selectedTools,
																includeAllTools,
															)
														}
														disabled={updateMcpServerMutation.isPending}
													/>
													<div className="flex-1">
														<div className="font-mono text-sm">{tool.name}</div>
														{tool.description && (
															<div className="text-xs text-muted-foreground mt-1 line-clamp-2">
																{tool.description}
															</div>
														)}
													</div>
												</div>
											);
										})}
										{tools.length === 0 && (
											<div className="text-sm text-muted-foreground text-center py-4">
												No tools available for this server
											</div>
										)}
									</div>
								</div>
							</CollapsibleContent>
						</Collapsible>
					</div>
				);
			})}
			{mcpServers.length === 0 && (
				<div className="text-center py-8 text-muted-foreground">
					<p>No servers configured for this chat.</p>
					<p className="text-sm mt-2">Add servers to configure their tools.</p>
				</div>
			)}
		</div>
	);
}
