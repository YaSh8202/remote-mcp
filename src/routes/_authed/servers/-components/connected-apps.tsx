import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import { AppLogo } from "@/components/AppLogo";
import { ConfirmationDeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTRPC } from "@/integrations/trpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Activity,
	ChevronDown,
	ChevronRight,
	Plus,
	Settings,
	Trash2,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddAppDialog } from "./add-app-dialog";
import { ConfigureAppDialog } from "./configure-app-dialog";

interface ConnectedAppsProps {
	serverApps: Array<{
		id: string;
		appName: string;
		tools: string[];
		connectionId: string | null;
	}>;
	getAppMetadata: (appName: string) => McpAppMetadata | undefined;
	serverId: string;
	onAppInstalled?: () => void;
}

export function ConnectedApps({
	serverApps,
	getAppMetadata,
	serverId,
	onAppInstalled,
}: ConnectedAppsProps) {
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
	const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
	const [selectedAppToRemove, setSelectedAppToRemove] = useState<{
		id: string;
		appName: string;
	} | null>(null);
	const [selectedAppToConfigure, setSelectedAppToConfigure] = useState<{
		id: string;
		appName: string;
		tools: string[];
		connectionId: string | null;
	} | null>(null);
	const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const removeAppMutation = useMutation({
		...trpc.mcpApp.removeApp.mutationOptions(),
		onSuccess: () => {
			toast.success("App removed successfully!");
			setRemoveDialogOpen(false);
			setSelectedAppToRemove(null);
			onAppInstalled?.(); // Refresh the data
			queryClient.invalidateQueries({
				queryKey: trpc.mcpApp.listServerApps.queryKey({ serverId }),
			});
		},
		onError: (error) => {
			toast.error(error.message || "Failed to remove app");
		},
	});

	const handleRemoveApp = (app: { id: string; appName: string }) => {
		setSelectedAppToRemove(app);
		setRemoveDialogOpen(true);
	};

	const handleConfigureApp = (app: {
		id: string;
		appName: string;
		tools: string[];
		connectionId: string | null;
	}) => {
		setSelectedAppToConfigure(app);
		setConfigureDialogOpen(true);
	};

	const toggleToolsExpansion = (appId: string) => {
		setExpandedTools((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(appId)) {
				newSet.delete(appId);
			} else {
				newSet.add(appId);
			}
			return newSet;
		});
	};

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Activity className="h-5 w-5" />
								Connected Applications ({serverApps.length})
							</CardTitle>
							<CardDescription>
								Manage applications connected to this MCP server
							</CardDescription>
						</div>
						<Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
							<Plus className="h-4 w-4" />
							Add App
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{serverApps.length > 0 ? (
						<div className="grid gap-4">
							{serverApps.map((app) => {
								const metadata = getAppMetadata(app.appName);
								return (
									<Card key={app.id} className="border-l-4 border-l-blue-500">
										<CardContent className="p-4">
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-3">
													<div className="p-2 bg-primary/10 rounded-lg">
														{metadata?.logo ? (
															<AppLogo
																logo={metadata.logo}
																appName={app.appName}
																className="h-6 w-6 "
															/>
														) : (
															<Activity className="h-6 w-6 text-primary" />
														)}
													</div>
													<div>
														<h3 className="font-semibold capitalize text-lg">
															{app.appName}
														</h3>
														<p className="text-sm text-muted-foreground">
															{app.tools.length} tools available
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
													<span className="text-xs text-muted-foreground">
														Connected
													</span>
												</div>
											</div>

											{/* Tools List */}
											<div className="mt-4">
												<button
													type="button"
													onClick={() => toggleToolsExpansion(app.id)}
													className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-primary transition-colors"
												>
													<Zap className="h-4 w-4" />
													Available Tools ({app.tools.length})
													{expandedTools.has(app.id) ? (
														<ChevronDown className="h-3 w-3" />
													) : (
														<ChevronRight className="h-3 w-3" />
													)}
												</button>
												{expandedTools.has(app.id) && (
													<div className="flex flex-wrap gap-2">
														{app.tools.map((tool) => (
															<span
																key={`${app.id}-${tool}`}
																className="px-2 py-1 bg-muted rounded-md text-xs font-mono"
															>
																{tool}
															</span>
														))}
													</div>
												)}
											</div>

											{/* Actions */}
											<div className="mt-4 flex gap-2">
												<Button
													variant="outline"
													size="sm"
													className="gap-2"
													onClick={() => handleConfigureApp(app)}
												>
													<Settings className="h-3 w-3" />
													Configure
												</Button>
												<Button
													variant="destructive"
													size="sm"
													className="gap-2"
													onClick={() => handleRemoveApp(app)}
												>
													<Trash2 className="h-3 w-3" />
													Remove
												</Button>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					) : (
						<div className="text-center py-12">
							<div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
								<Activity className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold mb-2">
								No apps connected yet
							</h3>
							<p className="text-muted-foreground mb-4">
								Connect your first application to start using this MCP server
							</p>
							<Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
								<Plus className="h-4 w-4" />
								Add Your First App
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<AddAppDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
				serverId={serverId}
				onAppInstalled={onAppInstalled}
			/>

			{selectedAppToConfigure && (
				<ConfigureAppDialog
					open={configureDialogOpen}
					onOpenChange={setConfigureDialogOpen}
					app={selectedAppToConfigure}
					getAppMetadata={getAppMetadata}
					serverId={serverId}
					onAppUpdated={() => {
						onAppInstalled?.(); // Refresh the data
						setConfigureDialogOpen(false);
						setSelectedAppToConfigure(null);
					}}
				/>
			)}

			<ConfirmationDeleteDialog
				open={removeDialogOpen}
				onOpenChange={setRemoveDialogOpen}
				title="Remove App"
				message={
					selectedAppToRemove ? (
						<>
							Are you sure you want to remove{" "}
							<strong>{selectedAppToRemove.appName}</strong> from this server?
							This action cannot be undone.
						</>
					) : (
						"Are you sure you want to remove this app?"
					)
				}
				entityName={selectedAppToRemove?.appName || "app"}
				mutationFn={async () => {
					if (selectedAppToRemove) {
						await removeAppMutation.mutateAsync({
							appId: selectedAppToRemove.id,
						});
					}
				}}
				isDanger={true}
				buttonText="Remove App"
				showToast={false} // We handle toast in the mutation
			/>
		</>
	);
}
