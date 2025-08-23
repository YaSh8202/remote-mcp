import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import { AppLogo } from "@/components/AppLogo";
import { Badge } from "@/components/ui/badge";
import { JsonViewer } from "@/components/ui/json-viewer";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, Clock, Server, Wrench } from "lucide-react";
import type { RunsTableData } from "./runs-columns";

interface RunDetailsSheetProps {
	runId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function RunDetailsSheet({
	runId,
	open,
	onOpenChange,
}: RunDetailsSheetProps) {
	const trpc = useTRPC();

	// Fetch available apps metadata
	const { data: appsMetadata = [] } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	const {
		data: run,
		isLoading,
		error,
	} = useQuery({
		...trpc.mcpRun.getRun.queryOptions({ id: runId }),
		enabled: open && !!runId,
	});

	// Helper function to get app metadata
	const getAppMetadata = (appName: string) => {
		return appsMetadata.find((app) => app.name === appName);
	};

	if (error) {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent className="w-full sm:w-[600px] sm:max-w-[600px]">
					<SheetHeader>
						<SheetTitle>Error Loading Run</SheetTitle>
						<SheetDescription>
							Failed to load run details: {error.message}
						</SheetDescription>
					</SheetHeader>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:w-[600px] sm:max-w-[600px] px-3 sm:px-6">
				<SheetHeader>
					<SheetTitle>Run Details</SheetTitle>
					<SheetDescription>
						View detailed information about this tool execution
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6">
					{isLoading ? (
						<RunDetailsSkeleton />
					) : run ? (
						<RunDetailsContent run={run} getAppMetadata={getAppMetadata} />
					) : (
						<div className="text-center py-8 text-muted-foreground">
							Run not found
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}

function RunDetailsContent({
	run,
	getAppMetadata,
}: {
	run: RunsTableData;
	getAppMetadata: (appName: string) => McpAppMetadata | undefined;
}) {
	const appMetadata = run.app ? getAppMetadata(run.app.appName) : undefined;
	return (
		<ScrollArea className="h-[calc(100vh-160px)]">
			<div className="space-y-6 pb-6">
				{/* Status and Basic Info */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						{run.status === "SUCCESS" ? (
							<CheckCircle className="h-5 w-5 text-green-500" />
						) : (
							<AlertCircle className="h-5 w-5 text-red-500" />
						)}
						<Badge
							variant={run.status === "SUCCESS" ? "default" : "destructive"}
							className="capitalize"
						>
							{run.status.toLowerCase()}
						</Badge>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium">
								<Wrench className="h-4 w-4" />
								Tool Name
							</div>
							<div className="text-sm text-muted-foreground">
								{run.toolName}
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium">
								<Clock className="h-4 w-4" />
								Executed
							</div>
							<div className="text-sm text-muted-foreground">
								{formatDistanceToNow(new Date(run.createdAt), {
									addSuffix: true,
								})}
							</div>
						</div>
					</div>

					{run.server && (
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium">
								<Server className="h-4 w-4" />
								Server
							</div>
							<div className="text-sm text-muted-foreground">
								{run.server.name}
							</div>
						</div>
					)}

					{run.app && (
						<div className="space-y-2">
							<div className="text-sm font-medium">App</div>
							<div className="flex items-center gap-2">
								{appMetadata ? (
									<AppLogo
										logo={appMetadata.logo}
										appName={appMetadata.displayName}
										className="h-5 w-5"
									/>
								) : (
									<div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-xs font-medium">
										{run.app.appName.charAt(0).toUpperCase()}
									</div>
								)}
								<span className="text-sm text-muted-foreground">
									{appMetadata?.displayName || run.app.appName}
								</span>
							</div>
						</div>
					)}
				</div>

				<Separator />

				{/* Input Section */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium">Input Parameters</h3>
					<JsonViewer data={run.input} />
				</div>

				<Separator />

				{/* Output Section */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium">Output Result</h3>
					<JsonViewer data={run.output} />
				</div>

				{/* Metadata Section */}
				{run.metadata && (
					<>
						<Separator />
						<div className="space-y-3">
							<h3 className="text-sm font-medium">Metadata</h3>
							<JsonViewer data={run.metadata} />
						</div>
					</>
				)}
			</div>
		</ScrollArea>
	);
}

function RunDetailsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-5 rounded-full" />
					<Skeleton className="h-6 w-20" />
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
			</div>

			<Separator />

			<div className="space-y-3">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-32 w-full" />
			</div>

			<Separator />

			<div className="space-y-3">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-32 w-full" />
			</div>
		</div>
	);
}
