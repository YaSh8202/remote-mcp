import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import { AppLogo } from "@/components/AppLogo";
import { SchemaDisplay } from "@/components/SchemaDisplay";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Code, Plus, Settings, Shield, Zap } from "lucide-react";
import { useState } from "react";
import { ConnectAppDialog } from "./-components/connect-app-dialog";

export const Route = createFileRoute("/_authed/apps/$id")({
	component: RouteComponent,
	loader: async ({ context, params }) => {
		const apps = await context.queryClient.ensureQueryData(
			context.trpc.mcpApp.getAvailableApps.queryOptions(),
		);
		const app = apps.find((app: McpAppMetadata) => app.name === params.id);
		if (!app) {
			throw notFound();
		}
		return { app };
	},
	notFoundComponent: () => {
		const navigate = useNavigate();

		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center max-w-lg mx-auto p-8 space-y-8">
				<div className="space-y-4 text-center">
					<div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
						<svg
							className="w-8 h-8 text-muted-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<div className="space-y-2">
						<h1 className="text-2xl font-semibold text-foreground">
							App Not Found
						</h1>
						<p className="text-sm text-muted-foreground max-w-md">
							The app you are looking for does not exist or may have been
							removed.
						</p>
					</div>
				</div>
				<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
					<Button
						onClick={() => navigate({ to: "/apps" })}
						className="min-w-[140px] gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Browse Apps
					</Button>
					<Button
						variant="outline"
						onClick={() => navigate({ to: "/" })}
						className="min-w-[140px]"
					>
						Go to Home
					</Button>
				</div>
			</div>
		);
	},
});

interface ToolCardProps {
	tool: {
		name: string;
		description?: string;
		paramsSchema?: Record<string, unknown>;
		annotations?: Record<string, unknown>;
	};
	onViewDetails: () => void;
}

function ToolCard({ tool, onViewDetails }: ToolCardProps) {
	return (
		<Card className="group hover:shadow-md transition-all duration-200">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-base flex items-center gap-2">
							<Code className="h-4 w-4 text-primary" />
							{tool.name}
						</CardTitle>
						{tool.description && (
							<CardDescription className="mt-1 line-clamp-2">
								{tool.description}
							</CardDescription>
						)}
					</div>
					{(tool.paramsSchema || tool.annotations) && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onViewDetails}
						>
							View Details
						</Button>
					)}
				</div>
			</CardHeader>
		</Card>
	);
}

function RouteComponent() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const trpc = useTRPC();
	const [connectDialogOpen, setConnectDialogOpen] = useState(false);
	const [selectedTool, setSelectedTool] = useState<{
		name: string;
		description?: string;
		paramsSchema?: Record<string, unknown>;
		annotations?: Record<string, unknown>;
	} | null>(null);
	const [toolSheetOpen, setToolSheetOpen] = useState(false);

	const { data: apps = [], isLoading } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	// Find the specific app
	const app = apps.find((app: McpAppMetadata) => app.name === id);

	// Configure page header
	usePageHeader({
		breadcrumbs: [
			{ label: "Apps", href: "/apps" },
			{ label: app?.displayName || id },
		],
		actions: [
			{
				id: "connect-app",
				label: "Connect App",
				icon: <Plus className="h-4 w-4" />,
				onClick: () => {
					setConnectDialogOpen(true);
				},
			},
		],
	});

	const getBadgeColor = (category: string) => {
		switch (category) {
			case "DEVELOPER_TOOLS":
				return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
			case "PRODUCTIVITY":
				return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
			case "COMMUNICATION":
				return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
			case "ENTERTAINMENT":
				return "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800";
			case "DATA_STORAGE":
				return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
			case "SEARCH":
				return "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800";
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

	const handleViewToolDetails = (tool: {
		name: string;
		description?: string;
		paramsSchema?: Record<string, unknown>;
		annotations?: Record<string, unknown>;
	}) => {
		setSelectedTool(tool);
		setToolSheetOpen(true);
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-6 space-y-6">
				{/* Back button */}
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate({ to: "/apps" })}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Apps
				</Button>

				{/* Loading skeleton */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-start gap-6">
								<Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
								<div className="flex-1 space-y-3">
									<Skeleton className="h-8 w-64" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-3/4" />
									<div className="flex gap-2">
										<Skeleton className="h-6 w-16 rounded-md" />
										<Skeleton className="h-6 w-20 rounded-md" />
									</div>
								</div>
							</div>
						</CardHeader>
					</Card>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card key={i} className="animate-pulse">
								<CardHeader>
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-3 w-full" />
									<Skeleton className="h-3 w-2/3" />
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!app) {
		throw notFound();
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Back button */}
			<Button
				variant="ghost"
				size="sm"
				onClick={() => navigate({ to: "/apps" })}
				className="gap-2"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to Apps
			</Button>

			{/* App Header */}
			<Card>
				<CardHeader>
					<div className="flex items-start gap-6">
						<AppLogo
							logo={app.logo}
							appName={app.displayName}
							className="h-20 w-20 rounded-lg flex-shrink-0"
						/>
						<div className="flex-1 space-y-4">
							<div>
								<h1 className="text-3xl font-bold">{app.displayName}</h1>
								<p className="text-lg text-muted-foreground mt-2">
									{app.description}
								</p>
							</div>

							{/* Categories */}
							<div className="flex flex-wrap gap-2">
								{app.categories.map((category) => (
									<span
										key={category}
										className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getBadgeColor(
											category,
										)}`}
									>
										{formatCategoryName(category)}
									</span>
								))}
							</div>

							{/* Key Stats */}
							<div className="flex flex-wrap gap-6 text-sm">
								<div className="flex items-center gap-2">
									<Zap className="h-4 w-4 text-orange-500" />
									<span className="font-medium">{app.tools.length}</span>
									<span className="text-muted-foreground">
										tool{app.tools.length !== 1 ? "s" : ""}
									</span>
								</div>
								{app.auth && (
									<div className="flex items-center gap-2">
										<Shield className="h-4 w-4 text-green-500" />
										<span className="text-muted-foreground">
											Requires authentication
										</span>
									</div>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<Button
									className="gap-2"
									onClick={() => setConnectDialogOpen(true)}
								>
									<Plus className="h-4 w-4" />
									Connect to Server
								</Button>
								<Button
									variant="outline"
									className="gap-2"
									onClick={() => navigate({ to: "/connections" })}
								>
									<Settings className="h-4 w-4" />
									Create Connection
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>
			</Card>

			<Separator />

			{/* Tools Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<Code className="h-6 w-6" />
					<h2 className="text-2xl font-semibold">Available Tools</h2>
					<span className="text-sm text-muted-foreground">
						({app.tools.length})
					</span>
				</div>

				{app.tools.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<div className="p-4 bg-muted rounded-full w-16 h-16 mb-4 flex items-center justify-center">
								<Code className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold mb-2">No tools available</h3>
							<p className="text-muted-foreground text-center max-w-md">
								This application doesn't have any tools configured yet.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{app.tools.map((tool, index) => (
							<ToolCard 
								key={`${tool.name}-${index}`} 
								tool={tool} 
								onViewDetails={() => handleViewToolDetails(tool)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Tool Details Sheet */}
			<Sheet open={toolSheetOpen} onOpenChange={setToolSheetOpen}>
				<SheetContent className="w-[400px] sm:w-[540px]">
					<SheetHeader>
						<SheetTitle className="flex items-center gap-2">
							<Code className="h-5 w-5 text-primary" />
							{selectedTool?.name}
						</SheetTitle>
						{selectedTool?.description && (
							<SheetDescription>
								{selectedTool.description}
							</SheetDescription>
						)}
					</SheetHeader>
					
					<div className="mt-6 space-y-6">
						{selectedTool?.paramsSchema && (
							<SchemaDisplay 
								schema={selectedTool.paramsSchema} 
								title="Parameters Schema" 
							/>
						)}
						{selectedTool?.annotations && (
							<div>
								<h5 className="text-sm font-medium mb-2">Annotations</h5>
								<pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
									<code>{JSON.stringify(selectedTool.annotations, null, 2)}</code>
								</pre>
							</div>
						)}
					</div>
				</SheetContent>
			</Sheet>

			{/* Connect App Dialog */}
			<ConnectAppDialog
				open={connectDialogOpen}
				onOpenChange={setConnectDialogOpen}
				app={app}
				onAppConnected={() => {
					// Optionally refresh data or show success message
					setConnectDialogOpen(false);
				}}
			/>
		</div>
	);
}
