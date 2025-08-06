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
import type { AppConnectionSchema, McpServer } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Server } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NewConnectionDialog } from "../../../../components/app-connection/new-connection-dialog";

interface ConnectAppDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	app: McpAppMetadata;
	onAppConnected?: () => void;
}

type Step = "select-server" | "configure-app";

export function ConnectAppDialog({
	open,
	onOpenChange,
	app,
	onAppConnected,
}: ConnectAppDialogProps) {
	const [step, setStep] = useState<Step>("select-server");
	const [selectedServer, setSelectedServer] = useState<McpServer | null>(null);
	const [selectedConnection, setSelectedConnection] = useState<
		string | undefined
	>(undefined);
	const [selectedTools, setSelectedTools] = useState<string[]>([]);
	const [newConnectionDialogOpen, setNewConnectionDialogOpen] = useState(false);
	const [creatingServer, setCreatingServer] = useState(false);

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// Fetch user's servers
	const { data: servers = [], isLoading: loadingServers } = useQuery(
		trpc.mcpServer.list.queryOptions(),
	);

	// Fetch connections for this app when on configure step
	const { data: connections, isLoading: loadingConnections } = useQuery({
		...trpc.appConnection.listConnections.queryOptions({
			appName: app.name,
		}),
		enabled: !!app.auth && step === "configure-app",
	});

	// Install app mutation
	const installApp = useMutation({
		...trpc.mcpApp.installApp.mutationOptions(),
		onSuccess: () => {
			toast.success(`${app.displayName} connected successfully!`);
			onAppConnected?.();
			handleClose();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to connect app");
		},
	});

	// Create server mutation
	const createServer = useMutation({
		...trpc.mcpServer.create.mutationOptions(),
		onSuccess: (newServer) => {
			// Select the newly created server and move to next step
			setSelectedServer(newServer);
			setSelectedTools(app.tools.map((tool) => tool.name)); // Select all tools by default
			setStep("configure-app");
			setCreatingServer(false);
			// Invalidate servers query to refresh the list
			queryClient.invalidateQueries({
				queryKey: trpc.mcpServer.list.queryKey(),
			});
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create server");
			setCreatingServer(false);
		},
	});

	const handleClose = () => {
		setStep("select-server");
		setSelectedServer(null);
		setSelectedConnection(undefined);
		setSelectedTools([]);
		setNewConnectionDialogOpen(false);
		setCreatingServer(false);
		onOpenChange(false);
	};

	const handleCreateNewServer = () => {
		setCreatingServer(true);
		createServer.mutate({
			name: `${app.displayName} Server`,
		});
	};

	const handleServerSelect = (server: McpServer) => {
		setSelectedServer(server);
		setSelectedTools(app.tools.map((tool) => tool.name)); // Select all tools by default
		setStep("configure-app");
	};

	const handleBack = () => {
		setStep("select-server");
		setSelectedServer(null);
		setSelectedConnection(undefined);
		setSelectedTools([]);
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
				appName: app.name,
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
			setSelectedTools(app.tools.map((tool) => tool.name));
		} else {
			setSelectedTools([]);
		}
	};

	const handleConnect = () => {
		if (!selectedServer || selectedTools.length === 0) return;

		installApp.mutate({
			serverId: selectedServer.id,
			appName: app.name,
			tools: selectedTools,
			connectionId: selectedConnection ?? null,
		});
	};

	const isAllToolsSelected =
		app.tools.length === selectedTools.length && selectedTools.length > 0;

	const isConnectDisabled =
		!selectedServer ||
		selectedTools.length === 0 ||
		(!selectedConnection && !!app.auth);

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl">
					{step === "select-server" && (
						<>
							<DialogHeader>
								<DialogTitle className="flex items-center gap-3">
									<AppLogo
										logo={app.logo}
										appName={app.displayName}
										className="h-6 w-6"
									/>
									Connect {app.displayName}
								</DialogTitle>
								<DialogDescription>
									Select a server to connect this app to
								</DialogDescription>
							</DialogHeader>

							<div className="py-4">
								{loadingServers ? (
									<div className="flex items-center justify-center py-8">
										<div className="text-sm text-muted-foreground">
											Loading your servers...
										</div>
									</div>
								) : servers.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 space-y-4">
										<div className="p-4 bg-muted rounded-full w-16 h-16 flex items-center justify-center">
											<Server className="h-8 w-8 text-muted-foreground" />
										</div>
										<div className="text-center">
											<h3 className="font-semibold mb-2">No servers found</h3>
											<p className="text-sm text-muted-foreground mb-4">
												You need to create a server first before connecting
												apps.
											</p>
											<Button
												onClick={() => {
													// TODO: Navigate to servers page or create server
													window.location.href = "/servers";
												}}
											>
												Create Your First Server
											</Button>
										</div>
									</div>
								) : (
									<div className="space-y-4">
										<div className="max-h-80 overflow-y-auto">
											<div className="grid grid-cols-1 gap-3 pr-2">
												{servers.map((server) => (
													<div
														key={server.id}
														className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50"
														onClick={() => handleServerSelect(server)}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																handleServerSelect(server);
															}
														}}
													>
														<div className="flex items-center gap-3">
															<div className="p-2 bg-primary/10 rounded-lg">
																<Server className="h-5 w-5 text-primary" />
															</div>
															<div>
																<h3 className="font-medium">{server.name}</h3>
																<p className="text-sm text-muted-foreground">
																	{server.apps?.length || 0} apps connected
																</p>
															</div>
														</div>
													</div>
												))}
											</div>
										</div>

										{/* Create new server button */}
										<div className="border-t pt-4">
											<Button
												variant="outline"
												className="w-full gap-2"
												onClick={handleCreateNewServer}
												disabled={creatingServer}
											>
												<Plus className="h-4 w-4" />
												{creatingServer
													? "Creating Server..."
													: "Create New Server"}
											</Button>
										</div>
									</div>
								)}
							</div>

							<DialogFooter>
								<Button variant="outline" onClick={handleClose}>
									Cancel
								</Button>
							</DialogFooter>
						</>
					)}

					{step === "configure-app" && selectedServer && (
						<>
							<DialogHeader>
								<DialogTitle className="flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={handleBack}
										className="p-1 h-auto"
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									Connect to {selectedServer.name}
								</DialogTitle>
								<DialogDescription>
									Configure {app.displayName} for this server
								</DialogDescription>
							</DialogHeader>

							<div className="py-4 space-y-6">
								{/* Connection Selection */}
								{app.auth && (
									<div className="space-y-3">
										<p className="text-base font-bold">Connection</p>
										{loadingConnections ? (
											<div className="flex items-center justify-center p-4 border rounded-lg">
												<div className="text-sm text-muted-foreground">
													Loading connections...
												</div>
											</div>
										) : connections && connections.length > 0 ? (
											<Select
												value={selectedConnection}
												onValueChange={handleConnectionChange}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select or add a connection" />
												</SelectTrigger>
												<SelectContent>
													{connections.map(
														(connection: AppConnectionSchema) => (
															<SelectItem
																key={connection.id}
																value={connection.id}
															>
																{connection.displayName}
															</SelectItem>
														),
													)}
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
												<div className="p-4 border rounded-lg text-center">
													<p className="text-sm text-muted-foreground mb-3">
														No connections available for {app.displayName}
													</p>
													<Button
														variant="outline"
														className="gap-2"
														onClick={() => setNewConnectionDialogOpen(true)}
													>
														<Plus className="h-4 w-4" />
														Connect to {app.displayName}
													</Button>
												</div>
											</div>
										)}
										{!selectedConnection && !loadingConnections && (
											<p className="text-xs text-destructive">
												A connection must be selected to add tools
											</p>
										)}
									</div>
								)}

								{/* Tools Selection */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="text-sm font-medium">Tools</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="select-all"
												checked={isAllToolsSelected}
												onCheckedChange={handleSelectAllToggle}
											/>
											<label
												htmlFor="select-all"
												className="text-sm font-medium cursor-pointer"
											>
												Select all
											</label>
										</div>
									</div>

									<div className="border rounded-lg max-h-64 overflow-y-auto">
										{app.tools.map((tool, index) => (
											<div
												key={tool.name}
												className={`flex items-start space-x-3 p-3 ${
													index < app.tools.length - 1 ? "border-b" : ""
												}`}
											>
												<Checkbox
													id={tool.name}
													checked={selectedTools.includes(tool.name)}
													onCheckedChange={(checked) =>
														handleToolToggle(tool.name, checked as boolean)
													}
												/>
												<div className="flex-1 min-w-0">
													<label
														htmlFor={tool.name}
														className="text-sm font-medium cursor-pointer"
													>
														{tool.name}
													</label>
													{tool.description && (
														<p className="text-xs text-muted-foreground mt-1">
															{tool.description}
														</p>
													)}
												</div>
											</div>
										))}
									</div>

									{selectedTools.length === 0 && (
										<p className="text-xs text-destructive">
											At least one tool must be selected
										</p>
									)}
								</div>
							</div>

							<DialogFooter>
								<Button variant="outline" onClick={handleBack}>
									Back
								</Button>
								<Button onClick={handleConnect} disabled={isConnectDisabled}>
									{installApp.isPending ? "Connecting..." : "Connect App"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* New Connection Dialog */}
			{app.auth && (
				<NewConnectionDialog
					open={newConnectionDialogOpen}
					onOpenChange={setNewConnectionDialogOpen}
					app={app}
					onSave={handleNewConnectionSave}
				/>
			)}
		</>
	);
}
