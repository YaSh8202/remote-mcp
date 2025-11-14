import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTRPC } from "@/integrations/trpc/react";
import { ExternalMCPIcon } from "./icons";
import { ExternalServerForm } from "./server-selection/external-server-form";
import { ServerList } from "./server-selection/server-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ServerSelectionPopoverProps {
	children: React.ReactNode;
	selectedServerIds: string[];
	onServerAdd: (serverId: string) => void;
	onExternalServerAdd: (config: {
		displayName: string;
		url: string;
		type: "http" | "sse";
		headers?: Record<string, string>;
	}) => Promise<{ success: boolean; error?: string }>;
}

export function ServerSelectionPopover({
	children,
	selectedServerIds,
	onServerAdd,
	onExternalServerAdd,
}: ServerSelectionPopoverProps) {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [showExternalForm, setShowExternalForm] = useState(false);

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

	// Detect if search query is a URL
	const isUrlQuery = useMemo(() => {
		const query = searchQuery.trim();
		try {
			const url = new URL(query);
			return url.protocol === "http:" || url.protocol === "https:";
		} catch {
			return false;
		}
	}, [searchQuery]);

	// Handle external server form submission
	const handleExternalServerSubmit = async (config: {
		displayName: string;
		url: string;
		type: "http" | "sse";
		headers?: Record<string, string>;
	}) => {
		const result = await onExternalServerAdd(config);

		if (result.success) {
			setShowExternalForm(false);
			setSearchQuery("");
			setOpen(false);
		}

		return result;
	};

	// Handle back from external form
	const handleBackFromExternalForm = () => {
		setShowExternalForm(false);
		setSearchQuery("");
	};

	// Transform servers data for ServerList component
	const serverListData = filteredServers.map((server) => ({
		id: server.id,
		name: server.name,
		apps: availableApps
			.filter((app) => server.apps?.some((sa) => sa.appName === app.name))
			.map((app) => ({ name: app.name, logo: app.logo })),
	}));

	return (
		<Popover
			open={open}
			onOpenChange={(newOpen) => {
				setOpen(newOpen);
				if (!newOpen) {
					setShowExternalForm(false);
					setSearchQuery("");
				}
			}}
		>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent
				className="w-96 p-0 bg-background border-border"
				align="start"
				side="top"
			>
				{showExternalForm ? (
					<ExternalServerForm
						onSubmit={handleExternalServerSubmit}
						onBack={handleBackFromExternalForm}
						initialUrl={isUrlQuery ? searchQuery.trim() : ""}
					/>
				) : (
					<>
						{/* Header */}
						<div className="p-3 pb-3 flex items-center space-x-2">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search servers"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10 bg-muted/30 border-0 h-10 focus-visible:ring-1 focus-visible:ring-ring"
								/>
							</div>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setShowExternalForm(true)}
									>
										<ExternalMCPIcon className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Add External Server</TooltipContent>
							</Tooltip>
							{/* <Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setOpen(false);
											// Open servers page in new tab
											window.open("/servers", "_blank");
										}}
									>
										<Plus className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Create New Server</TooltipContent>
							</Tooltip> */}
						</div>

						<ScrollArea className="">
							<div className="px-3 pb-3 max-h-80">
								{/* Show URL detection hint */}
								{isUrlQuery && (
									<div className="mb-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
										<p className="text-sm text-foreground mb-2">
											URL detected - Click the link icon to add as external
											server
										</p>
									</div>
								)}

								<ServerList
									servers={serverListData}
									onServerClick={handleServerClick}
									emptyMessage={
										searchQuery.trim()
											? "No servers found"
											: "No servers available"
									}
									emptySubMessage={
										!searchQuery.trim()
											? "Create a server to add to this chat."
											: undefined
									}
								/>
							</div>
						</ScrollArea>
					</>
				)}
			</PopoverContent>
		</Popover>
	);
}
