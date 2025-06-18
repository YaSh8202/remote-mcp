import type { McpAppMetadata } from "@/app/mcp/mcp-app";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { McpApp, McpServer } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	Calendar,
	Globe,
	Plus,
	Server,
	Settings,
	Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authed/servers/")({
	component: RouteComponent,
});

interface ServerWithApps extends McpServer {
	apps: McpApp[];
}

interface ServerCardProps {
	server: ServerWithApps;
	appsMetadata: McpAppMetadata[];
}

function ServerCard({ server, appsMetadata }: ServerCardProps) {
	const navigate = useNavigate();

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(date));
	};

	const getAppLogo = (appName: string) => {
		const appMetadata = appsMetadata.find((app) => app.name === appName);
		return appMetadata?.logoUrl || "/favicon.ico";
	};

	const connectedApps = server.apps || [];

	return (
		<Card className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Server className="h-5 w-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-lg group-hover:text-primary transition-colors">
								{server.name}
							</CardTitle>
							<CardDescription className="flex items-center gap-1 mt-1">
								<Calendar className="h-3 w-3" />
								Created {formatDate(server.createdAt)}
							</CardDescription>
						</div>
					</div>
					<CardAction>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => navigate({ to: `/servers/${server.id}` })}
						>
							<Settings className="h-4 w-4" />
						</Button>
					</CardAction>
				</div>
			</CardHeader>

			<CardContent>
				<div className="space-y-4">
					{/* Server Status */}
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
						<span className="text-sm text-muted-foreground">Active</span>
					</div>

					{/* Connected Apps */}
					<div>
						<h4 className="text-sm font-medium mb-2 flex items-center gap-2">
							<Activity className="h-4 w-4" />
							Connected Apps ({connectedApps.length})
						</h4>
						{connectedApps.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{connectedApps.map((app: McpApp) => (
									<div
										key={app.id}
										className="flex items-center gap-2 bg-muted rounded-md px-2 py-1 text-xs"
									>
										<img
											src={getAppLogo(app.appName)}
											alt={app.appName}
											className="h-4 w-4 rounded"
											onError={(e) => {
												const target = e.target as HTMLImageElement;
												target.src = "/favicon.ico";
											}}
										/>
										<span className="capitalize">{app.appName}</span>
										<span className="text-muted-foreground">
											({app.tools.length} tools)
										</span>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground">No apps connected</p>
						)}
					</div>

					{/* Server ID */}
					<div className="pt-2 border-t">
						<p className="text-xs text-muted-foreground font-mono">
							ID: {server.id}
						</p>
					</div>
				</div>
			</CardContent>

			<CardFooter>
				<Button
					variant="outline"
					size="sm"
					className="w-full"
					onClick={() => navigate({ to: `/servers/${server.id}` })}
				>
					Manage Server
				</Button>
			</CardFooter>
		</Card>
	);
}

function ServerCardSkeleton() {
	return (
		<Card className="animate-pulse">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<Skeleton className="h-9 w-9 rounded-lg" />
						<div>
							<Skeleton className="h-5 w-32 mb-2" />
							<Skeleton className="h-3 w-24" />
						</div>
					</div>
					<Skeleton className="h-8 w-8 rounded" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<Skeleton className="h-4 w-16" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-6 w-full" />
					</div>
					<Skeleton className="h-3 w-20" />
				</div>
			</CardContent>
			<CardFooter>
				<Skeleton className="h-8 w-full" />
			</CardFooter>
		</Card>
	);
}

function RouteComponent() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	
	const { data: servers = [], isLoading: serversLoading } = useQuery(
		trpc.mcpServer.list.queryOptions(),
	);
	const { data: appsMetadata = [], isLoading: appsLoading } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	const addServerMutation = useMutation({
		...trpc.mcpServer.create.mutationOptions(),
		onSuccess: (data) => {
			navigate({
				to: `/servers/${data.id}`,
			});
		},
	});
	
	// Configure page header
	usePageHeader({
		breadcrumbs: [
			{ label: "Servers" }
		],
		actions: [
			{
				id: "add-server",
				label: "Add Server", 
				icon: <Plus className="h-4 w-4" />,
				onClick: () => {
					addServerMutation.mutate({
						name: "Untitled Server",
					});
				},
				disabled: addServerMutation.isPending
			}
		]
	});

	// Calculate total connected apps across all servers
	const totalConnectedApps = servers.reduce((total, server) => {
		return total + (server.apps?.length || 0);
	}, 0);

	const isLoading = serversLoading || appsLoading;

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="border-blue-200 dark:border-blue-800">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
								<Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								{isLoading ? (
									<div className="space-y-1">
										<Skeleton className="h-6 w-8" />
										<Skeleton className="h-3 w-20" />
									</div>
								) : (
									<>
										<p className="text-2xl font-bold">{servers.length}</p>
										<p className="text-sm text-muted-foreground">
											Total Servers
										</p>
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-green-200 dark:border-green-800">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
								<Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
							</div>
							<div>
								{isLoading ? (
									<div className="space-y-1">
										<Skeleton className="h-6 w-8" />
										<Skeleton className="h-3 w-24" />
									</div>
								) : (
									<>
										<p className="text-2xl font-bold">{totalConnectedApps}</p>
										<p className="text-sm text-muted-foreground">
											Connected Apps
										</p>
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-orange-200 dark:border-orange-800">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
								<Globe className="h-5 w-5 text-orange-600 dark:text-orange-400" />
							</div>
							<div>
								{isLoading ? (
									<div className="space-y-1">
										<Skeleton className="h-6 w-8" />
										<Skeleton className="h-3 w-24" />
									</div>
								) : (
									<>
										<p className="text-2xl font-bold">{appsMetadata.length}</p>
										<p className="text-sm text-muted-foreground">
											Available Apps
										</p>
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Servers Grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<ServerCardSkeleton />
					<ServerCardSkeleton />
					<ServerCardSkeleton />
				</div>
			) : servers.length === 0 ? (
				<Card className="p-12 text-center border-2 border-dashed">
					<div className="mx-auto max-w-md">
						<div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
							<Server className="h-8 w-8 text-blue-600 dark:text-blue-400" />
						</div>
						<h3 className="text-lg font-semibold mb-2">No servers yet</h3>
						<p className="text-muted-foreground mb-4">
							Get started by creating your first MCP server to connect
							applications and tools.
						</p>
						<Button
							onClick={() =>
								addServerMutation.mutate({
									name: "My First Server",
								})
							}
							disabled={addServerMutation.isPending}
							className="gap-2"
						>
							<Plus className="h-4 w-4" />
							Create Your First Server
						</Button>
					</div>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{servers.map((server) => (
						<ServerCard
							key={server.id}
							server={server}
							appsMetadata={appsMetadata}
						/>
					))}
				</div>
			)}

			{/* Available Apps Section */}
			{!isLoading && appsMetadata.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Globe className="h-5 w-5 text-muted-foreground" />
						<h2 className="text-xl font-semibold">Available Applications</h2>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{appsMetadata.map((app) => (
							<Card
								key={app.name}
								className="p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
							>
								<div className="flex items-center gap-3">
									<img
										src={app.logoUrl}
										alt={app.name}
										className="h-8 w-8 rounded"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.src = "/favicon.ico";
										}}
									/>
									<div className="flex-1 min-w-0">
										<p className="font-medium truncate">{app.name}</p>
										<p className="text-xs text-muted-foreground truncate flex items-center gap-1">
											<Zap className="h-3 w-3" />
											{app.tools.length} tools available
										</p>
									</div>
								</div>
							</Card>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
