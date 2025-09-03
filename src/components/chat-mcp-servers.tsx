import { useState } from "react";
import { PlusIcon, ServerIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/integrations/trpc/react";

interface ChatMCPServersProps {
	chatId: string;
	mcpServerIds: string[];
	onUpdate: (serverIds: string[]) => void;
}

export function ChatMCPServers({ chatId, mcpServerIds, onUpdate }: ChatMCPServersProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedServerId, setSelectedServerId] = useState<string>("");

	const { data: availableServers = [] } = trpc.mcpServer.list.useQuery();
	const { data: chatServers = [] } = trpc.mcpServer.list.useQuery({
		ids: mcpServerIds,
	});

	const updateChatMutation = trpc.chat.updateChat.useMutation({
		onSuccess: () => {
			setIsDialogOpen(false);
			setSelectedServerId("");
		},
	});

	const handleAddServer = () => {
		if (!selectedServerId) return;

		const newServerIds = [...mcpServerIds, selectedServerId];
		updateChatMutation.mutate({
			chatId,
			mcpServerIds: newServerIds,
		});
		onUpdate(newServerIds);
	};

	const handleRemoveServer = (serverId: string) => {
		const newServerIds = mcpServerIds.filter(id => id !== serverId);
		updateChatMutation.mutate({
			chatId,
			mcpServerIds: newServerIds,
		});
		onUpdate(newServerIds);
	};

	const availableToAdd = availableServers.filter(
		server => !mcpServerIds.includes(server.id)
	);

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-medium">MCP Servers</h4>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm">
							<PlusIcon className="h-3 w-3 mr-1" />
							Add Server
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add MCP Server</DialogTitle>
							<DialogDescription>
								Add an MCP server to this chat to enable additional tools and capabilities.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium">Select Server</label>
								<Select value={selectedServerId} onValueChange={setSelectedServerId}>
									<SelectTrigger>
										<SelectValue placeholder="Choose an MCP server" />
									</SelectTrigger>
									<SelectContent>
										{availableToAdd.map((server) => (
											<SelectItem key={server.id} value={server.id}>
												<div className="flex items-center gap-2">
													<ServerIcon className="h-4 w-4" />
													<span>{server.name}</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{availableToAdd.length === 0 && (
								<p className="text-sm text-muted-foreground">
									All available MCP servers are already added to this chat.
								</p>
							)}
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleAddServer}
								disabled={!selectedServerId || updateChatMutation.isPending}
							>
								Add Server
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="flex flex-wrap gap-2">
				{chatServers.map((server) => (
					<Badge key={server.id} variant="secondary" className="flex items-center gap-1">
						<ServerIcon className="h-3 w-3" />
						<span>{server.name}</span>
						<Button
							variant="ghost"
							size="sm"
							className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
							onClick={() => handleRemoveServer(server.id)}
							disabled={updateChatMutation.isPending}
						>
							<XIcon className="h-3 w-3" />
						</Button>
					</Badge>
				))}

				{chatServers.length === 0 && (
					<p className="text-xs text-muted-foreground">
						No MCP servers added. Add servers to enable additional AI capabilities.
					</p>
				)}
			</div>
		</div>
	);
}