"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, Plus } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { ExternalServerDetailsPopover } from "@/components/external-server-details-popover";
import { MCPIcon } from "@/components/icons";
import { ServerDetailsPopover } from "@/components/server-details-popover";
import { ServerSelectionPopover } from "@/components/server-selection-popover";
import { Button } from "@/components/ui/button";
import type { ChatMcpServer, McpServer } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";

export type ServerSelectionBarProps = {
	selectedServerIds: string[];
	onServerAdd: (serverId: string) => void | Promise<void>;
	onServerRemove: (serverId: string) => void | Promise<void>;
	onExternalServerAdd: (config: {
		displayName: string;
		url: string;
		type: "http" | "sse";
		headers?: Record<string, string>;
	}) => Promise<{ success: boolean; error?: string }>;
	externalServers?: Array<{
		chatMcpServer: ChatMcpServer;
		mcpServerData: McpServer | null;
	}>;
	onExternalServerRemove?: (chatMcpServerId: string) => void | Promise<void>;
};

export function ServerSelectionBar({
	selectedServerIds,
	onServerAdd,
	onServerRemove,
	onExternalServerAdd,
	externalServers = [],
	onExternalServerRemove,
}: ServerSelectionBarProps) {
	const trpc = useTRPC();

	const { data: servers = [] } = useSuspenseQuery(
		trpc.mcpServer.list.queryOptions(),
	);

	const { data: availableApps } = useSuspenseQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	// Get selected servers details
	const selectedServers = servers.filter((server) =>
		selectedServerIds.includes(server.id),
	);

	// Filter external servers that aren't remote MCP servers
	const displayExternalServers = externalServers.filter(
		(server) => !server.chatMcpServer.isRemoteMcp,
	);

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{/* Remote Servers */}
			{selectedServers.map((server) => (
				<ServerDetailsPopover
					key={server.id}
					serverId={server.id}
					onRemove={() => onServerRemove(server.id)}
				>
					<Button size="sm" variant="secondary">
						<div className="flex -space-x-3">
							{server.apps.slice(0, 3).map((app) => (
								<div
									key={app.appName}
									className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/70 border border-background"
								>
									<AppLogo
										logo={
											availableApps.find((a) => a.name === app.appName)?.logo
										}
										className="h-3.5 w-3.5"
									/>
								</div>
							))}
						</div>
						<span>{server.name}</span>
						<ChevronDown className="h-3 w-3 ml-0.5" />
					</Button>
				</ServerDetailsPopover>
			))}

			{/* External Servers */}
			{displayExternalServers.map((externalServer) => (
				<ExternalServerDetailsPopover
					key={externalServer.chatMcpServer.id}
					chatMcpServer={externalServer.chatMcpServer}
					onRemove={
						onExternalServerRemove
							? () => onExternalServerRemove(externalServer.chatMcpServer.id)
							: undefined
					}
				>
					<Button size="sm" variant="secondary">
						<div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/70 border border-background">
							<MCPIcon className="h-3.5 w-3.5 text-primary" />
						</div>
						<span>
							{externalServer.chatMcpServer.displayName || "External Server"}
						</span>
						<ChevronDown className="h-3 w-3 ml-0.5" />
					</Button>
				</ExternalServerDetailsPopover>
			))}

			{/* Add Server Button */}
			<ServerSelectionPopover
				selectedServerIds={selectedServerIds}
				onServerAdd={onServerAdd}
				onExternalServerAdd={onExternalServerAdd}
			>
				<Button
					variant="secondary"
					size="sm"
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					<span>
						{selectedServerIds.length === 0 &&
						displayExternalServers.length === 0 ? (
							"Add Tools"
						) : (
							<MCPIcon className="size-3" />
						)}
					</span>
				</Button>
			</ServerSelectionPopover>
		</div>
	);
}
