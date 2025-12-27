import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ToolSelector,
	ToolSelectorCheckbox,
	ToolSelectorContent,
	ToolSelectorDescription,
	ToolSelectorEmpty,
	ToolSelectorGroup,
	ToolSelectorInput,
	ToolSelectorItem,
	ToolSelectorList,
	ToolSelectorName,
	ToolSelectorServer,
	ToolSelectorServerHeader,
	ToolSelectorServerName,
	ToolSelectorToolInfo,
	ToolSelectorTrigger,
} from "@/components/ai-elements/tool-selector";
import { useMcpServerListToosl } from "@/hooks/query-hooks/use-mcp-server-list-tools";
import { useTRPC } from "@/integrations/trpc/react";
import { cn } from "@/lib/utils";
import type { ToolDescription } from "@/services/mcp-server";
import { IconoirTools } from "../icons";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/spinner";

// Local state for tracking pending changes
interface ServerToolSelection {
	tools: string[];
	includeAllTools: boolean;
}

function ToolsSelector() {
	const { chatId } = useParams({
		from: "/_authed/chat/$chatId",
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [expandedServers, setExpandedServers] = useState<Set<string>>(
		new Set(),
	);
	const [searchValue, setSearchValue] = useState("");
	// Local state to track pending changes (keyed by chatMcpServer.id)
	const [pendingChanges, setPendingChanges] = useState<
		Record<string, ServerToolSelection>
	>({});

	const trpc = useTRPC();
	const queryClient = useQueryClient();

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

	const { data: mcpServerTools, isLoading } = useMcpServerListToosl({
		mcpServers: selectedServers,
	});

	// Build server tools lookup
	const serverToolsMap = useMemo(() => {
		const map: Record<string, ToolDescription[]> = {};
		mcpServers?.forEach((serverData, index) => {
			const serverKey =
				serverData.mcpServerData?.id || serverData.chatMcpServer.id;
			map[serverKey] = mcpServerTools?.[index]?.tools || [];
		});
		return map;
	}, [mcpServers, mcpServerTools]);

	// Initialize pending changes when dialog opens
	useEffect(() => {
		if (dialogOpen && mcpServers) {
			const initialState: Record<string, ServerToolSelection> = {};
			for (const serverData of mcpServers) {
				initialState[serverData.chatMcpServer.id] = {
					tools: serverData.chatMcpServer.tools || [],
					includeAllTools: serverData.chatMcpServer.includeAllTools ?? false,
				};
			}
			setPendingChanges(initialState);
		}
	}, [dialogOpen, mcpServers]);

	// Get current selection state (pending or original)
	const getServerSelection = useCallback(
		(chatMcpServerId: string): ServerToolSelection => {
			if (pendingChanges[chatMcpServerId]) {
				return pendingChanges[chatMcpServerId];
			}
			const serverData = mcpServers?.find(
				(s) => s.chatMcpServer.id === chatMcpServerId,
			);
			return {
				tools: serverData?.chatMcpServer.tools || [],
				includeAllTools: serverData?.chatMcpServer.includeAllTools ?? false,
			};
		},
		[pendingChanges, mcpServers],
	);

	const selectedToolsCount = useMemo(() => {
		if (!mcpServerTools || !selectedServers) return 0;

		return selectedServers.reduce((acc, server) => {
			// Use pending changes if dialog is open, otherwise use original
			const selection = dialogOpen
				? getServerSelection(server.id)
				: { tools: server.tools, includeAllTools: server.includeAllTools };

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
				return acc + (serverInfo ? serverInfo.tools.length : 0);
			}
			if (selection.tools && selection.tools.length > 0) {
				return acc + selection.tools.length;
			}
			return acc;
		}, 0);
	}, [
		mcpServerTools,
		selectedServers,
		mcpServers,
		dialogOpen,
		getServerSelection,
	]);

	// Mutation for updating MCP server tools
	const updateMcpServerMutation = useMutation({
		...trpc.chat.updateMcpServer.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.chat.listMcpServers.queryKey({ chatId }),
			});
			queryClient.invalidateQueries({
				queryKey: ["mcpServerListTools"],
			});
		},
	});

	// Save all pending changes on dialog close
	const handleDialogChange = useCallback(
		async (open: boolean) => {
			if (!open && Object.keys(pendingChanges).length > 0) {
				// Dialog is closing, save all changes
				const mutations = Object.entries(pendingChanges).map(
					([id, selection]) => {
						const originalServer = mcpServers?.find(
							(s) => s.chatMcpServer.id === id,
						);
						const original = {
							tools: originalServer?.chatMcpServer.tools || [],
							includeAllTools:
								originalServer?.chatMcpServer.includeAllTools ?? false,
						};

						// Only mutate if there are actual changes
						const hasChanges =
							selection.includeAllTools !== original.includeAllTools ||
							JSON.stringify(selection.tools.sort()) !==
								JSON.stringify(original.tools.sort());

						if (hasChanges) {
							return updateMcpServerMutation.mutateAsync({
								id,
								tools: selection.tools,
								includeAllTools: selection.includeAllTools,
							});
						}
						return Promise.resolve();
					},
				);

				await Promise.all(mutations);
				setPendingChanges({});
			}
			if (!open) {
				// Reset search when closing
				setSearchValue("");
			}
			setDialogOpen(open);
		},
		[pendingChanges, mcpServers, updateMcpServerMutation],
	);

	const toggleServerExpanded = useCallback((serverId: string) => {
		setExpandedServers((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(serverId)) {
				newSet.delete(serverId);
			} else {
				newSet.add(serverId);
			}
			return newSet;
		});
	}, []);

	const handleToolToggle = useCallback(
		(chatMcpServerId: string, toolName: string, serverKey: string) => {
			setPendingChanges((prev) => {
				const current =
					prev[chatMcpServerId] || getServerSelection(chatMcpServerId);
				let newTools: string[];
				let newIncludeAllTools = current.includeAllTools;

				if (current.includeAllTools) {
					// Switching from "all tools" to selective
					const allToolNames = (serverToolsMap[serverKey] || []).map(
						(tool) => tool.name,
					);
					newTools = allToolNames.filter((name) => name !== toolName);
					newIncludeAllTools = false;
				} else {
					if (current.tools.includes(toolName)) {
						newTools = current.tools.filter((name) => name !== toolName);
					} else {
						newTools = [...current.tools, toolName];
					}
				}

				return {
					...prev,
					[chatMcpServerId]: {
						tools: newTools,
						includeAllTools: newIncludeAllTools,
					},
				};
			});
		},
		[serverToolsMap, getServerSelection],
	);

	const handleServerToggle = useCallback(
		(chatMcpServerId: string, includeAll: boolean) => {
			setPendingChanges((prev) => ({
				...prev,
				[chatMcpServerId]: {
					tools: [],
					includeAllTools: includeAll,
				},
			}));
		},
		[],
	);

	return (
		<ToolSelector open={dialogOpen} onOpenChange={handleDialogChange}>
			<ToolSelectorTrigger asChild>
				<Button
					variant="ghost"
					size={"sm"}
					className={cn("justify-between px-0", {
						// hidden: selectedToolsCount === 0 && !isLoading,
					})}
				>
					<div className="flex items-center gap-2 truncate">
						<span className="text-sm">
							<IconoirTools />
						</span>
						{isLoading ? (
							<LoadingSpinner className="h-3 w-3" />
						) : selectedToolsCount === 0 ? (
							"No"
						) : (
							selectedToolsCount
						)}{" "}
						Tools
					</div>
					<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</ToolSelectorTrigger>
			<ToolSelectorContent title="Select Tools" className="max-w-xl">
				<ToolSelectorInput
					placeholder="Search tools..."
					value={searchValue}
					onValueChange={setSearchValue}
				/>
				<ToolSelectorList className="max-h-[400px]">
					{searchValue.trim().length > 0 && (
						<ToolSelectorEmpty>No tools found.</ToolSelectorEmpty>
					)}
					{mcpServers?.map((serverData) => {
						const { chatMcpServer, mcpServerData } = serverData;
						const serverKey = mcpServerData?.id || chatMcpServer.id;
						const serverName =
							mcpServerData?.name ||
							chatMcpServer.displayName ||
							"Unknown Server";
						// When searching, always show tools (expanded)
						const isSearching = searchValue.trim().length > 0;
						const isExpanded = isSearching || expandedServers.has(serverKey);
						const tools = serverToolsMap[serverKey] || [];

						// Use pending state for UI
						const selection = getServerSelection(chatMcpServer.id);
						const selectedTools = selection.tools;
						const includeAllTools = selection.includeAllTools;

						const isServerSelected =
							includeAllTools ||
							(tools.length > 0 &&
								tools.every((t) => selectedTools.includes(t.name)));
						const isIndeterminate =
							!includeAllTools &&
							selectedTools.length > 0 &&
							selectedTools.length < tools.length;

						// Calculate selected count for this server
						const serverSelectedCount = includeAllTools
							? tools.length
							: selectedTools.filter((t) =>
									tools.some((tool) => tool.name === t),
								).length;

						return (
							<ToolSelectorGroup key={chatMcpServer.id} className="py-1">
								<ToolSelectorServer>
									{!isSearching && (
										<ToolSelectorServerHeader
											onClick={() => toggleServerExpanded(serverKey)}
										>
											<button
												type="button"
												className="flex items-center"
												onClick={(e) => {
													e.stopPropagation();
													toggleServerExpanded(serverKey);
												}}
											>
												{isExpanded ? (
													<ChevronDown className="h-4 w-4" />
												) : (
													<ChevronRight className="h-4 w-4" />
												)}
											</button>
											<ToolSelectorCheckbox
												checked={
													isIndeterminate ? "indeterminate" : isServerSelected
												}
												onClick={(e) => e.stopPropagation()}
												onCheckedChange={(checked) => {
													handleServerToggle(chatMcpServer.id, !!checked);
												}}
											/>
											{/* <IconoirTools className="h-4 w-4 text-muted-foreground" /> */}
											<ToolSelectorServerName>
												{serverName}
											</ToolSelectorServerName>
											<span className="ml-auto text-xs text-muted-foreground">
												{serverSelectedCount}/{tools.length}
											</span>
										</ToolSelectorServerHeader>
									)}
									{isExpanded && (
										<div
											className={cn("space-y-0.5", {
												"ml-6 mt-1": !isSearching,
											})}
										>
											{tools.map((tool) => {
												const isSelected =
													includeAllTools || selectedTools.includes(tool.name);
												return (
													<ToolSelectorItem
														key={tool.name}
														value={`${serverName} ${tool.name} ${tool.description || ""}`}
														onSelect={() =>
															handleToolToggle(
																chatMcpServer.id,
																tool.name,
																serverKey,
															)
														}
													>
														<ToolSelectorCheckbox
															checked={isSelected}
															onClick={(e) => e.stopPropagation()}
															onCheckedChange={() =>
																handleToolToggle(
																	chatMcpServer.id,
																	tool.name,
																	serverKey,
																)
															}
														/>
														<IconoirTools className="h-4 w-4 text-muted-foreground shrink-0" />
														<ToolSelectorToolInfo>
															<ToolSelectorName>{tool.name}</ToolSelectorName>
															{tool.description && (
																<ToolSelectorDescription>
																	{tool.description}
																</ToolSelectorDescription>
															)}
														</ToolSelectorToolInfo>
													</ToolSelectorItem>
												);
											})}
											{tools.length === 0 && !isSearching && (
												<div className="text-xs text-muted-foreground py-2 px-2">
													No tools available
												</div>
											)}
										</div>
									)}
								</ToolSelectorServer>
							</ToolSelectorGroup>
						);
					})}
				</ToolSelectorList>
			</ToolSelectorContent>
		</ToolSelector>
	);
}

export default ToolsSelector;
