import type { McpAppMetadata } from "@/app/mcp/mcp-app";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	BookOpen,
	CheckCircle,
	Code,
	Copy,
	ExternalLink,
	Globe,
	Plus,
	Server,
	Settings,
	Terminal,
	Trash2,
	Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authed/servers/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const serverId = Route.useParams().id;
	const [copied, setCopied] = useState<string | null>(null);

	const { data: server } = useSuspenseQuery(
		trpc.mcpServer.findOrThrow.queryOptions({
			id: serverId,
		}),
	);

	const { data: appsMetadata = [] } = useSuspenseQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	const { data: serverApps = [] } = useSuspenseQuery(
		trpc.mcpApp.listServerApps.queryOptions({
			serverId,
		}),
	);

	const deleteServerMutation = useMutation({
		...trpc.mcpServer.delete.mutationOptions(),
		onSuccess: () => {
			navigate({ to: "/servers" });
		},
	});

	const copyToClipboard = async (text: string, type: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(type);
			setTimeout(() => setCopied(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(date));
	};

	const getAppMetadata = (appName: string): McpAppMetadata | undefined => {
		return appsMetadata.find((app: McpAppMetadata) => app.name === appName);
	};

	const serverUrl = `https://cloud.activepieces.com/api/v1/mcp/${server.token}/sse`;

	// Configure page header with breadcrumbs and actions
	usePageHeader({
		breadcrumbs: [
			{ label: "Servers", href: "/servers" },
			{ label: server?.name || "Server" },
		],
		actions: [
			{
				id: "edit-server",
				label: "Edit",
				icon: <Settings className="h-4 w-4" />,
				onClick: () => {
					// Add edit functionality here
					console.log("Edit server:", serverId);
				},
				variant: "outline" as const,
			},
			{
				id: "delete-server",
				label: "Delete",
				icon: <Trash2 className="h-4 w-4" />,
				onClick: () => {
					if (confirm(`Are you sure you want to delete "${server?.name}"?`)) {
						deleteServerMutation.mutate({ id: serverId });
					}
				},
				variant: "destructive" as const,
				disabled: deleteServerMutation.isPending,
			},
		],
	});

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card className="border-blue-200 dark:border-blue-800">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
								<Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-lg font-bold">Active</p>
								<p className="text-sm text-muted-foreground">Server Status</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-green-200 dark:border-green-800">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
								<Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
							</div>
							<div>
								<p className="text-lg font-bold">{serverApps.length}</p>
								<p className="text-sm text-muted-foreground">Connected Apps</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-orange-200 dark:border-orange-800">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
								<Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
							</div>
							<div>
								<p className="text-lg font-bold">
									{serverApps.reduce(
										(total, app) => total + app.tools.length,
										0,
									)}
								</p>
								<p className="text-sm text-muted-foreground">Total Tools</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-purple-200 dark:border-purple-800">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
								<Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
							</div>
							<div>
								<p className="text-lg font-bold">
									{formatDate(new Date(server.createdAt))}
								</p>
								<p className="text-sm text-muted-foreground">Created</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Connected Apps */}
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
								<Button className="gap-2">
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
											<Card
												key={app.id}
												className="border-l-4 border-l-blue-500"
											>
												<CardContent className="p-4">
													<div className="flex items-start justify-between">
														<div className="flex items-center gap-3">
															<div className="p-2 bg-primary/10 rounded-lg">
																{metadata?.logoUrl ? (
																	<img
																		src={metadata.logoUrl}
																		alt={app.appName}
																		className="h-6 w-6"
																		onError={(e) => {
																			const target =
																				e.target as HTMLImageElement;
																			target.style.display = "none";
																		}}
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
														<h4 className="text-sm font-medium mb-2 flex items-center gap-2">
															<Zap className="h-4 w-4" />
															Available Tools
														</h4>
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
													</div>

													{/* Actions */}
													<div className="mt-4 flex gap-2">
														<Button
															variant="outline"
															size="sm"
															className="gap-2"
														>
															<Settings className="h-3 w-3" />
															Configure
														</Button>
														<Button
															variant="outline"
															size="sm"
															className="gap-2"
														>
															<ExternalLink className="h-3 w-3" />
															View Docs
														</Button>
														<Button
															variant="destructive"
															size="sm"
															className="gap-2"
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
										Connect your first application to start using this MCP
										server
									</p>
									<Button className="gap-2">
										<Plus className="h-4 w-4" />
										Add Your First App
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Available Apps to Connect */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Globe className="h-5 w-5" />
								Available Applications
							</CardTitle>
							<CardDescription>
								Apps you can connect to this MCP server
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{" "}
								{appsMetadata
									.filter(
										(app: McpAppMetadata) =>
											!serverApps.some(
												(serverApp) => serverApp.appName === app.name,
											),
									)
									.map((app: McpAppMetadata) => (
										<Card
											key={app.name}
											className="hover:shadow-md transition-all duration-200 cursor-pointer"
										>
											<CardContent className="p-4">
												<div className="flex items-center gap-3 mb-3">
													<img
														src={app.logoUrl}
														alt={app.name}
														className="h-8 w-8 rounded"
														onError={(e) => {
															const target = e.target as HTMLImageElement;
															target.src = "/favicon.ico";
														}}
													/>
													<div className="flex-1">
														<h3 className="font-medium">{app.name}</h3>
														<p className="text-xs text-muted-foreground">
															{app.tools.length} tools available
														</p>
													</div>
												</div>
												<Button
													variant="outline"
													size="sm"
													className="w-full gap-2"
												>
													<Plus className="h-3 w-3" />
													Connect
												</Button>
											</CardContent>
										</Card>
									))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Server Details */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Server className="h-5 w-5" />
								Server Details
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Server ID
								</p>
								<div className="flex items-center gap-2 mt-1">
									<code className="px-2 py-1 bg-muted rounded text-xs font-mono flex-1 truncate">
										{server.id}
									</code>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => copyToClipboard(server.id, "id")}
										className="h-7 w-7 p-0"
									>
										{copied === "id" ? (
											<CheckCircle className="h-3 w-3 text-green-500" />
										) : (
											<Copy className="h-3 w-3" />
										)}
									</Button>
								</div>
							</div>

							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Auth Token
								</p>
								<div className="flex items-center gap-2 mt-1">
									<code className="px-2 py-1 bg-muted rounded text-xs font-mono flex-1 truncate">
										{server.token.substring(0, 8)}...
									</code>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => copyToClipboard(server.token, "token")}
										className="h-7 w-7 p-0"
									>
										{copied === "token" ? (
											<CheckCircle className="h-3 w-3 text-green-500" />
										) : (
											<Copy className="h-3 w-3" />
										)}
									</Button>
								</div>
							</div>

							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Server URL
								</p>
								<div className="flex items-center gap-2 mt-1">
									<code className="px-2 py-1 bg-muted rounded text-xs font-mono flex-1 truncate">
										{serverUrl}
									</code>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => copyToClipboard(serverUrl, "url")}
										className="h-7 w-7 p-0"
									>
										{copied === "url" ? (
											<CheckCircle className="h-3 w-3 text-green-500" />
										) : (
											<Copy className="h-3 w-3" />
										)}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* How to Connect */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BookOpen className="h-5 w-5" />
								How to Connect
							</CardTitle>
							<CardDescription>
								Connect this MCP server to your AI applications
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Claude Desktop */}
							<div className="space-y-2">
								<h4 className="font-medium flex items-center gap-2">
									<Code className="h-4 w-4" />
									Claude Desktop
								</h4>
								<p className="text-sm text-muted-foreground">
									Add this server to your Claude Desktop configuration:
								</p>
								<div className="bg-muted p-3 rounded-lg">
									<code className="text-xs block">
										{JSON.stringify(
											{
												mcpServers: {
													[server.name]: {
														command: "node",
														args: [
															"--experimental-websocket-client",
															serverUrl,
														],
													},
												},
											},
											null,
											2,
										)}
									</code>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="w-full gap-2"
									onClick={() =>
										copyToClipboard(
											JSON.stringify(
												{
													mcpServers: {
														[server.name]: {
															command: "node",
															args: [
																"--experimental-websocket-client",
																serverUrl,
															],
														},
													},
												},
												null,
												2,
											),
											"claude-config",
										)
									}
								>
									{copied === "claude-config" ? (
										<CheckCircle className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									Copy Configuration
								</Button>
							</div>

							{/* API Integration */}
							<div className="space-y-2">
								<h4 className="font-medium flex items-center gap-2">
									<Terminal className="h-4 w-4" />
									API Integration
								</h4>
								<p className="text-sm text-muted-foreground">
									Use the server URL directly in your applications:
								</p>
								<div className="bg-muted p-2 rounded text-xs font-mono break-all">
									{serverUrl}
								</div>
							</div>

							{/* Documentation Link */}
							<Button variant="outline" className="w-full gap-2">
								<ExternalLink className="h-4 w-4" />
								View Documentation
							</Button>
						</CardContent>
					</Card>

					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle>Quick Actions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Button variant="outline" className="w-full justify-start gap-2">
								<Activity className="h-4 w-4" />
								View Server Logs
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2">
								<Settings className="h-4 w-4" />
								Server Settings
							</Button>
							<Button variant="outline" className="w-full justify-start gap-2">
								<Code className="h-4 w-4" />
								Export Configuration
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
