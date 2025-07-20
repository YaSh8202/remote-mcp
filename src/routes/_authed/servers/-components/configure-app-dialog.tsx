import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { AppConnectionSchema } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NewConnectionDialog } from "../../../../components/app-connection/new-connection-dialog";

interface ConfigureAppDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	app: {
		id: string;
		appName: string;
		tools: string[];
		connectionId: string | null;
	};
	getAppMetadata: (appName: string) => McpAppMetadata | undefined;
	serverId: string;
	onAppUpdated?: () => void;
}

export function ConfigureAppDialog({
	open,
	onOpenChange,
	app,
	getAppMetadata,
	serverId,
	onAppUpdated,
}: ConfigureAppDialogProps) {
	const [selectedConnection, setSelectedConnection] = useState<
		string | undefined
	>(app.connectionId || undefined);
	const [selectedTools, setSelectedTools] = useState<string[]>(app.tools);
	const [newConnectionDialogOpen, setNewConnectionDialogOpen] = useState(false);

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const appMetadata = getAppMetadata(app.appName);

	// Fetch connections for this app
	const { data: connections, isLoading: loadingConnections } = useQuery({
		...trpc.appConnection.listConnections.queryOptions({
			appName: app.appName,
		}),
		enabled: !!appMetadata?.auth && open,
	});

	// Update mutation
	const updateAppMutation = useMutation({
		...trpc.mcpApp.updateApp.mutationOptions(),
		onSuccess: () => {
			toast.success("App configuration updated successfully!");
			onAppUpdated?.();
			handleClose();
			// Invalidate queries to refresh data
			queryClient.invalidateQueries({
				queryKey: trpc.mcpApp.listServerApps.queryKey({ serverId }),
			});
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update app configuration");
		},
	});

	// Reset form when dialog opens/closes or app changes
	useEffect(() => {
		if (open) {
			setSelectedConnection(app.connectionId || undefined);
			setSelectedTools(app.tools);
		}
	}, [open, app.connectionId, app.tools]);

	const handleClose = () => {
		setSelectedConnection(app.connectionId || undefined);
		setSelectedTools(app.tools);
		setNewConnectionDialogOpen(false);
		onOpenChange(false);
	};

	const handleConnectionChange = (value: string) => {
		if (value === "add-new") {
			setNewConnectionDialogOpen(true);
		} else {
			setSelectedConnection(value);
		}
	};

	const handleNewConnectionSave = () => {
		setNewConnectionDialogOpen(false);
		// Invalidate connections query to refresh the list
		queryClient.invalidateQueries({
			queryKey: trpc.appConnection.listConnections.queryKey({
				appName: app.appName,
			}),
		});
	};

	const handleToolToggle = (toolName: string, checked: boolean) => {
		if (checked) {
			setSelectedTools((prev) => [...prev, toolName]);
		} else {
			setSelectedTools((prev) => prev.filter((t) => t !== toolName));
		}
	};

	const handleSelectAllToggle = (checked: boolean) => {
		if (checked) {
			setSelectedTools(appMetadata?.tools.map((tool) => tool.name) ?? []);
		} else {
			setSelectedTools([]);
		}
	};

	const handleSubmit = () => {
		if (selectedTools.length === 0) {
			toast.error("Please select at least one tool");
			return;
		}

		updateAppMutation.mutate({
			appId: app.id,
			connectionId: selectedConnection || null,
			tools: selectedTools,
		});
	};

	const hasChanges =
		selectedConnection !== (app.connectionId || undefined) ||
		JSON.stringify(selectedTools.sort()) !== JSON.stringify(app.tools.sort());

	if (!appMetadata) {
		return null;
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3">
							<AppLogo
								logo={appMetadata.logo}
								appName={app.appName}
								className="h-8 w-8 rounded"
							/>
							Configure {appMetadata.displayName}
						</DialogTitle>
						<DialogDescription>
							Update the connection and tools for this app
						</DialogDescription>
					</DialogHeader>

					<div className="py-4 space-y-6">
						{/* Connection Section */}
						{appMetadata.auth && (
							<div className="space-y-3">
								<h3 className="text-base font-bold">Connection</h3>
								{loadingConnections ? (
									<div className="flex items-center justify-center p-4 border rounded-lg">
										<div className="text-sm text-muted-foreground">
											Loading connections...
										</div>
									</div>
								) : connections && connections.length > 0 ? (
									<Select
										value={selectedConnection || ""}
										onValueChange={handleConnectionChange}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select a connection" />
										</SelectTrigger>
										<SelectContent>
											{connections.map((connection: AppConnectionSchema) => (
												<SelectItem key={connection.id} value={connection.id}>
													{connection.displayName}
												</SelectItem>
											))}
											<SelectItem value="add-new">
												<div className="flex items-center gap-2">
													<Plus className="h-3 w-3" />
													Add new connection
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								) : (
									<div className="space-y-3">
										<div className="text-center py-4 border rounded-lg">
											<p className="text-sm text-muted-foreground mb-2">
												No connections available for this app
											</p>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setNewConnectionDialogOpen(true)}
												className="gap-2"
											>
												<Plus className="h-3 w-3" />
												Create Connection
											</Button>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Tools Section */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="text-base font-bold">Tools</h3>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="select-all"
										checked={
											selectedTools.length === appMetadata.tools.length &&
											selectedTools.length > 0
										}
										onCheckedChange={handleSelectAllToggle}
									/>
									<label
										htmlFor="select-all"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Select All
									</label>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
								{appMetadata.tools.map((tool) => (
									<div
										key={tool.name}
										className="flex items-start space-x-2 p-3 border rounded-lg"
									>
										<Checkbox
											id={tool.name}
											checked={selectedTools.includes(tool.name)}
											onCheckedChange={(checked) =>
												handleToolToggle(tool.name, !!checked)
											}
										/>
										<div className="grid gap-1.5 leading-none">
											<label
												htmlFor={tool.name}
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												{tool.name}
											</label>
											{tool.description && (
												<p className="text-xs text-muted-foreground">
													{tool.description}
												</p>
											)}
										</div>
									</div>
								))}
							</div>

							{selectedTools.length === 0 && (
								<p className="text-sm text-destructive">
									At least one tool must be selected
								</p>
							)}
						</div>
					</div>

					<DialogFooter>
						{updateAppMutation.error && (
							<div className="w-full">
								<p className="text-sm text-destructive mb-2">
									{updateAppMutation.error.message}
								</p>
							</div>
						)}
						<Button variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={!hasChanges || selectedTools.length === 0 || updateAppMutation.isPending}
						>
							{updateAppMutation.isPending ? "Updating..." : "Update"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* New Connection Dialog */}
			{appMetadata && (
				<NewConnectionDialog
					open={newConnectionDialogOpen}
					onOpenChange={setNewConnectionDialogOpen}
					app={appMetadata}
					onSave={handleNewConnectionSave}
				/>
			)}
		</>
	);
}
