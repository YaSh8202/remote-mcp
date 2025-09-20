import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTRPC } from "@/integrations/trpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus, Search, Server } from "lucide-react";
import { useMemo, useState } from "react";
import { AppLogo } from "./AppLogo";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ServerSelectionPopoverProps {
	children: React.ReactNode;
	selectedServerIds: string[];
	onServerAdd: (serverId: string) => void;
}

export function ServerSelectionPopover({
	children,
	selectedServerIds,
	onServerAdd,
}: ServerSelectionPopoverProps) {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");
	const [open, setOpen] = useState(false);

	const { data: servers = [] } = useSuspenseQuery(
		trpc.mcpServer.list.queryOptions(),
	);

	const { data: availableApps } = useSuspenseQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	// Filter servers based on search query and exclude already selected servers
	const filteredServers = useMemo(() => {
		const availableServers = servers.filter(
			(server) => !selectedServerIds.includes(server.id),
		);

		if (!searchQuery.trim()) return availableServers;

		const query = searchQuery.toLowerCase();
		return availableServers.filter(
			(server) =>
				server.name.toLowerCase().includes(query) ||
				server.id.toLowerCase().includes(query),
		);
	}, [servers, searchQuery, selectedServerIds]);

	const handleServerClick = (serverId: string) => {
		onServerAdd(serverId);
		setOpen(false);
		setSearchQuery(""); // Clear search when closing
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent
				className="w-96 p-0 bg-background border-border"
				align="start"
				side="top"
			>
				{/* Header */}
				<div className="p-3 pb-3 flex items-center space-x-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search or paste mcp url"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 bg-muted/30 border-0 h-10 focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>
					<Tooltip>
						<TooltipTrigger>
							<Link to="/servers" target="_blank">
								<Button
									variant={"ghost"}
									size="icon"
									onClick={() => setOpen(false)}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</Link>
						</TooltipTrigger>
						<TooltipContent>Add New Server</TooltipContent>
					</Tooltip>
				</div>

				<ScrollArea className="max-h-96">
					<div className="px-3 pb-3">
						{filteredServers.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<Server className="h-8 w-8 mx-auto opacity-50 mb-2" />
								<p className="text-sm text-muted-foreground">
									{searchQuery.trim()
										? "No servers found"
										: "No servers available"}
								</p>
								{!searchQuery.trim() && (
									<p className="text-xs text-muted-foreground mt-1">
										Create a server first to add to this chat.
									</p>
								)}
							</div>
						) : (
							<div className="space-y-2">
								{filteredServers.map((server) => {
									const apps = availableApps.filter((app) =>
										server.apps?.some((sa) => sa.appName === app.name),
									);

									return (
										<div
											key={server.id}
											onClick={() => handleServerClick(server.id)}
											className="flex items-center gap-3 p-1 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 group"
										>
											{/* Server Icon */}
											<div className="flex h-7 items-center justify-center rounded-md  group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
												{/* <Server className="h-4 w-4 text-primary" /> */}
												{apps.length === 0 ? (
													<div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/70 border border-background">
														<Server className="h-4 w-4 text-primary" />
													</div>
												) : (
													<div className="flex -space-x-3">
														{apps.slice(0, 3).map((app) => (
															<div
																key={app.name}
																className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/70 border border-background"
															>
																<AppLogo
																	key={app.name}
																	logo={app.logo}
																	className="h-4 w-4"
																/>
															</div>
														))}
													</div>
												)}
											</div>
											{/* Server Info */}
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<p className="font-medium text-sm truncate group-hover:text-foreground transition-colors">
														{server.name}
													</p>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
