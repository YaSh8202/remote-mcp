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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { ChevronLeft, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NewConnectionDialog } from "../../../../components/app-connection/new-connection-dialog";

interface AddAppDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serverId: string;
	onAppInstalled?: () => void;
}

type Step = "select-app" | "configure-app";

export function AddAppDialog({
	open,
	onOpenChange,
	serverId,
	onAppInstalled,
}: AddAppDialogProps) {
	const [step, setStep] = useState<Step>("select-app");
	const [selectedApp, setSelectedApp] = useState<McpAppMetadata | null>(null);
	const [selectedConnection, setSelectedConnection] = useState<
		string | undefined
	>(undefined);
	const [selectedTools, setSelectedTools] = useState<string[]>([]);
	const [newConnectionDialogOpen, setNewConnectionDialogOpen] = useState(false);

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// Queries using the correct tRPC pattern
	const { data: availableApps, isLoading: loadingApps } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	const { data: connections, isLoading: loadingConnections } = useQuery({
		...trpc.appConnection.listConnections.queryOptions({
			appName: selectedApp?.name ?? "",
		}),
		enabled: !!selectedApp?.name && step === "configure-app",
	});

	const { data: installedApps } = useQuery(
		trpc.mcpApp.listServerApps.queryOptions({
			serverId,
		}),
	);

	// Mutations using the correct tRPC pattern
	const installApp = useMutation({
		...trpc.mcpApp.installApp.mutationOptions(),
		onSuccess: (data) => {
			toast.success(`${data.appName} tools added successfully!`);
			onAppInstalled?.();
			handleClose();
			// Invalidate queries to refresh data
			queryClient.invalidateQueries({
				queryKey: trpc.mcpApp.listServerApps.queryKey({ serverId }),
			});
		},
		onError: (error) => {
			toast.error(error.message || "Failed to add app tools");
		},
	});

	const availableAppsToInstall = availableApps?.filter(
		(app: McpAppMetadata) =>
			!installedApps?.some((installedApp) => installedApp.appName === app.name),
	);

	const handleClose = () => {
		setStep("select-app");
		setSelectedApp(null);
		setSelectedConnection("");
		setSelectedTools([]);
		setNewConnectionDialogOpen(false);
		onOpenChange(false);
	};

	const handleAppSelect = (app: McpAppMetadata) => {
		setSelectedApp(app);
		setSelectedTools(app.tools.map((tool) => tool.name)); // Select all tools by default
		setStep("configure-app");
	};

	const handleBack = () => {
		setStep("select-app");
		setSelectedApp(null);
		setSelectedConnection("");
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
		// The connection is created inside the dialog, so we need to refresh the connections list
		// and the dialog will handle closing itself
		setNewConnectionDialogOpen(false);
		// Invalidate connections query to refresh the list
		queryClient.invalidateQueries({
			queryKey: trpc.appConnection.listConnections.queryKey({
				appName: selectedApp?.name ?? "",
			}),
		});
	};

	const handleNewConnectionDialogClose = (open: boolean) => {
		setNewConnectionDialogOpen(open);
		// If dialog is being closed and no connection was created, reset the selection
		if (!open) {
			setSelectedConnection(undefined);
		}
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
			setSelectedTools(selectedApp?.tools.map((tool) => tool.name) ?? []);
		} else {
			setSelectedTools([]);
		}
	};

	const handleInstall = () => {
		if (!selectedApp || selectedTools.length === 0) return;

		installApp.mutate({
			serverId,
			appName: selectedApp.name,
			tools: selectedTools,
			connectionId: selectedConnection ?? null,
		});
	};

	const isAllToolsSelected =
		selectedApp?.tools.length === selectedTools.length &&
		selectedTools.length > 0;

	const isInstallDisabled =
		!selectedApp ||
		selectedTools.length === 0 ||
		(!selectedConnection && !!selectedApp.auth);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className=" max-w-11/12 md:max-w-2xl">
				{step === "select-app" && (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Plus className="h-5 w-5" />
								Add New App
							</DialogTitle>
							<DialogDescription>
								Select an app to connect to your MCP server
							</DialogDescription>
						</DialogHeader>

						<div className="py-4">
							{loadingApps ? (
								<div className="flex items-center justify-center py-8">
									<div className="text-sm text-muted-foreground">
										Loading available apps...
									</div>
								</div>
							) : availableAppsToInstall?.length === 0 ? (
								<div className="flex items-center justify-center py-8">
									<div className="text-sm text-muted-foreground">
										No more apps available to install
									</div>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 h-[50vh] overflow-auto space-y-2">
									{availableAppsToInstall?.map((app: McpAppMetadata) => (
										<div
											key={app.name}
											className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50 text-center"
											onClick={() => handleAppSelect(app)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													handleAppSelect(app);
												}
											}}
										>
											<div className="flex flex-col items-center gap-3">
												<AppLogo
													logo={app.logo}
													appName={app.name}
													className="h-12 w-12 rounded"
												/>

												<h3 className="font-medium text-center">
													{app.displayName}
												</h3>
											</div>
										</div>
									))}
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

				{step === "configure-app" && selectedApp && (
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
								Configure {selectedApp.name}
							</DialogTitle>
							<DialogDescription>
								Select connection and tools for this app
							</DialogDescription>
						</DialogHeader>

						<div className="py-4 space-y-6">
							{/* Connection Selection */}
							{selectedApp.auth && (
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
											<div className="p-4 border rounded-lg text-center">
												<p className="text-sm text-muted-foreground mb-3">
													No connections available for {selectedApp.displayName}
												</p>
												<Button
													variant="outline"
													className="gap-2"
													onClick={() => setNewConnectionDialogOpen(true)}
												>
													<Plus className="h-4 w-4" />
													Connect to {selectedApp.displayName}
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
									{selectedApp.tools.map((tool, index) => (
										<div
											key={tool.name}
											className={`flex items-start space-x-3 p-3 ${
												index < selectedApp.tools.length - 1 ? "border-b" : ""
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
							<Button onClick={handleInstall} disabled={isInstallDisabled}>
								{installApp.isPending ? "Adding..." : "Add Tools"}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
			{selectedApp?.auth && (
				<NewConnectionDialog
					open={newConnectionDialogOpen}
					onOpenChange={handleNewConnectionDialogClose}
					app={selectedApp}
					onSave={handleNewConnectionSave}
				/>
			)}
		</Dialog>
	);
}
