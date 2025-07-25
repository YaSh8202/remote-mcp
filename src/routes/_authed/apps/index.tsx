import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AppWindow,
	ExternalLink,
	Link2,
	Plus,
	Search,
	Shield,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { ConnectAppDialog } from "./-components/connect-app-dialog";

export const Route = createFileRoute("/_authed/apps/")({
	component: RouteComponent,
});

interface AppCardProps {
	app: McpAppMetadata;
	connectionCount?: number;
}

function AppCard({ app, connectionCount = 0 }: AppCardProps) {
	const navigate = useNavigate();
	const [connectDialogOpen, setConnectDialogOpen] = useState(false);

	const getBadgeColor = (category: string) => {
		switch (category) {
			case "DEVELOPER_TOOLS":
				return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
			case "PRODUCTIVITY":
				return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
			case "COMMUNICATION":
				return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
		}
	};

	const formatCategoryName = (category: string) => {
		return category
			.split("_")
			.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
			.join(" ");
	};

	return (
		<Card className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 h-full flex flex-col">
			<CardHeader>
				<div className="flex items-start gap-4">
					<AppLogo
						logo={app.logo}
						appName={app.displayName}
						className="h-12 w-12 rounded-lg flex-shrink-0"
					/>
					<div className="flex-1 min-w-0">
						<CardTitle className="text-lg group-hover:text-primary transition-colors">
							{app.displayName}
						</CardTitle>
						<CardDescription className="line-clamp-2 mt-1">
							{app.description}
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex-1">
				<div className="space-y-4">
					{/* Categories */}
					<div className="flex flex-wrap gap-1">
						{app.categories.map((category) => (
							<span
								key={category}
								className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getBadgeColor(
									category,
								)}`}
							>
								{formatCategoryName(category)}
							</span>
						))}
					</div>

					{/* Tools count */}
					<div className="flex items-center gap-2 text-sm">
						<Zap className="h-4 w-4 text-orange-500" />
						<span className="text-muted-foreground">
							{app.tools.length} tool{app.tools.length !== 1 ? "s" : ""}{" "}
							available
						</span>
					</div>

					{/* Connection count */}
					{connectionCount > 0 && (
						<div className="flex items-center gap-2 text-sm">
							<Link2 className="h-4 w-4 text-blue-500" />
							<span className="text-muted-foreground">
								{connectionCount} connection{connectionCount !== 1 ? "s" : ""}
							</span>
						</div>
					)}

					{/* Authentication indicator */}
					{app.auth && (
						<div className="flex items-center gap-2 text-sm">
							<Shield className="h-4 w-4 text-green-500" />
							<span className="text-muted-foreground">
								Requires authentication
							</span>
						</div>
					)}
				</div>
			</CardContent>

			<CardFooter className="pt-4 gap-2">
				<Button
					variant="outline"
					size="sm"
					className="flex-1"
					onClick={() => navigate({ to: `/apps/${app.name}` })}
				>
					<ExternalLink className="h-4 w-4 mr-2" />
					View Details
				</Button>
				<Button
					size="sm"
					className="flex-1"
					onClick={() => setConnectDialogOpen(true)}
				>
					<Plus className="h-4 w-4 mr-2" />
					Connect
				</Button>
			</CardFooter>

			{/* Connect App Dialog */}
			<ConnectAppDialog
				open={connectDialogOpen}
				onOpenChange={setConnectDialogOpen}
				app={app}
				onAppConnected={() => {
					setConnectDialogOpen(false);
				}}
			/>
		</Card>
	);
}

function AppCardSkeleton() {
	return (
		<Card className="animate-pulse h-full flex flex-col">
			<CardHeader>
				<div className="flex items-start gap-4">
					<Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
					<div className="flex-1 min-w-0">
						<Skeleton className="h-5 w-32 mb-2" />
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-3/4 mt-1" />
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1">
				<div className="space-y-4">
					<div className="flex gap-1">
						<Skeleton className="h-5 w-16 rounded-md" />
						<Skeleton className="h-5 w-20 rounded-md" />
					</div>
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-32" />
				</div>
			</CardContent>
			<CardFooter className="pt-4 gap-2">
				<Skeleton className="h-8 flex-1" />
				<Skeleton className="h-8 flex-1" />
			</CardFooter>
		</Card>
	);
}

function RouteComponent() {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");

	const { data: apps = [], isLoading } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	const { data: connectionCounts = {} } = useQuery(
		trpc.appConnection.getConnectionCountsByApp.queryOptions(),
	);

	// Filter apps based on search query
	const filteredApps = apps.filter(
		(app) =>
			app.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.categories.some((category) =>
				category.toLowerCase().includes(searchQuery.toLowerCase()),
			) ||
			app.tools.some((tool) =>
				tool.name.toLowerCase().includes(searchQuery.toLowerCase()),
			),
	);

	// Configure page header
	usePageHeader({
		breadcrumbs: [{ label: "Apps" }],
	});

	if (isLoading) {
		return (
			<div className="container mx-auto p-6 space-y-6">
				{/* Page Header */}
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<AppWindow className="h-6 w-6" />
						<h1 className="text-2xl font-semibold tracking-tight">
							Available Apps
						</h1>
					</div>
					<p className="text-muted-foreground">
						Discover and connect powerful applications to your MCP servers
					</p>
				</div>

				{/* Stats Overview */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
									<AppWindow className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<Skeleton className="h-6 w-8 mb-1" />
									<Skeleton className="h-3 w-20" />
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
									<Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<Skeleton className="h-6 w-8 mb-1" />
									<Skeleton className="h-3 w-16" />
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
									<Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div>
									<Skeleton className="h-6 w-8 mb-1" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Loading skeleton grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<AppCardSkeleton key={i} />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Page Header */}
			<div className="space-y-2">
				<div className="flex items-center gap-3">
					<AppWindow className="h-6 w-6" />
					<h1 className="text-2xl font-semibold tracking-tight">
						Available Apps
						{filteredApps.length > 0 && searchQuery
							? ` (${filteredApps.length} of ${apps.length})`
							: apps.length > 0
								? ` (${apps.length})`
								: ""}
					</h1>
				</div>
				<p className="text-muted-foreground">
					Discover and connect powerful applications to your MCP servers
				</p>
			</div>

			{/* Search Bar */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search apps by name, description, category, or tools..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Apps Grid */}
			{apps.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<div className="p-4 bg-muted rounded-full w-16 h-16 mb-4 flex items-center justify-center">
							<AppWindow className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold mb-2">No apps available</h3>
						<p className="text-muted-foreground mb-4 text-center max-w-md">
							It looks like there are no applications available at the moment.
							Check back later for new integrations.
						</p>
					</CardContent>
				</Card>
			) : filteredApps.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<div className="p-4 bg-muted rounded-full w-16 h-16 mb-4 flex items-center justify-center">
							<Search className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold mb-2">No apps found</h3>
						<p className="text-muted-foreground mb-4 text-center max-w-md">
							No applications match your search criteria. Try a different search
							term or clear the search to see all apps.
						</p>
						<Button
							variant="outline"
							onClick={() => setSearchQuery("")}
							className="mt-2"
						>
							Clear Search
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredApps.map((app) => (
						<AppCard
							key={app.name}
							app={app}
							connectionCount={connectionCounts[app.name] || 0}
						/>
					))}
				</div>
			)}
		</div>
	);
}
