import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import { ConfirmationDeleteDialog } from "@/components/delete-dialog";
import EditableText from "@/components/ui/editable-text";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2, Zap } from "lucide-react";
import { useState } from "react";
import {
	ConnectedApps,
	HowToConnect,
	ServerDetails,
	ServerStatsCards,
} from "./-components";
export const Route = createFileRoute("/_authed/servers/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const trpc = useTRPC();
	const navigate = useNavigate();
	const serverId = Route.useParams().id;
	const [copied, setCopied] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isEditingName, setIsEditingName] = useState(false);
	const queryClient = useQueryClient();

	const { data: server, refetch: refetchServer } = useSuspenseQuery(
		trpc.mcpServer.findOrThrow.queryOptions({
			id: serverId,
		}),
	);

	const { data: appsMetadata = [] } = useSuspenseQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	const { data: serverApps = [], refetch: refetchServerApps } =
		useSuspenseQuery(
			trpc.mcpApp.listServerApps.queryOptions({
				serverId,
			}),
		);

	const deleteServerMutation = useMutation({
		...trpc.mcpServer.delete.mutationOptions(),
	});

	const updateServerMutation = useMutation({
		...trpc.mcpServer.update.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.mcpServer.list.queryKey(),
			});
		},
	});

	const copyToClipboard = async (text: string, type: string) => {
		try {
			if (typeof window !== "undefined" && navigator.clipboard) {
				await navigator.clipboard.writeText(text);
				setCopied(type);
				setTimeout(() => setCopied(null), 2000);
			}
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleServerNameUpdate = async (newName: string) => {
		if (newName.trim() && newName !== server.name) {
			// Optimistically update the UI
			queryClient.setQueryData(
				trpc.mcpServer.findOrThrow.queryKey({ id: serverId }),
				(old) => (old ? { ...old, name: newName.trim() } : old),
			);

			try {
				await updateServerMutation.mutateAsync({
					id: serverId,
					name: newName.trim(),
				});
			} catch (error) {
				// Revert the optimistic update on error
				queryClient.setQueryData(
					trpc.mcpServer.findOrThrow.queryKey({ id: serverId }),
					(old) => (old ? { ...old, name: server.name } : old),
				);
				console.error("Failed to update server name:", error);
			}
		}
	};

	const getAppMetadata = (appName: string): McpAppMetadata | undefined => {
		return appsMetadata.find((app: McpAppMetadata) => app.name === appName);
	};

	const serverUrl = `${
		typeof window === "undefined" ? "" : window.location.origin
	}/api/mcp/${server.token}`;

	// Configure page header with breadcrumbs and actions
	usePageHeader({
		breadcrumbs: [{ label: "Servers", href: "/servers" }],
		title: (
			<EditableText
				value={server.name}
				className="text-base font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded"
				readonly={false}
				onValueChange={handleServerNameUpdate}
				tooltipContent="Click to edit server name"
				isEditing={isEditingName}
				setIsEditing={setIsEditingName}
			/>
		),
		actions: [
			{
				id: "runs",
				label: "Runs",
				icon: <Zap className="h-4 w-4" />,
				onClick: () => {
					navigate({
						to: "/runs",
						search: {
							server: [serverId],
						},
					});
				},
				variant: "outline",
			},
			{
				id: "delete-server",
				label: "Delete",
				icon: <Trash2 className="h-4 w-4" />,
				onClick: () => {
					setDeleteDialogOpen(true);
				},
				variant: "destructive" as const,
				disabled: deleteServerMutation.isPending,
			},
		],
	});

	return (
		<div className="container mx-auto p-1 md:p-6 space-y-6">
			<ServerStatsCards serverApps={serverApps} serverId={serverId} />

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
				<div className="lg:col-span-2 space-y-6">
					<ConnectedApps
						serverApps={serverApps}
						getAppMetadata={getAppMetadata}
						serverId={serverId}
						onAppInstalled={() => {
							refetchServerApps();
							refetchServer();
						}}
					/>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Server Details */}
					<ServerDetails
						serverUrl={serverUrl}
						copied={copied}
						copyToClipboard={copyToClipboard}
					/>

					{/* How to Connect */}
					<HowToConnect
						serverName={server.name}
						serverUrl={serverUrl}
						copied={copied}
						copyToClipboard={copyToClipboard}
					/>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			<ConfirmationDeleteDialog
				title="Delete Server"
				message={
					<span>
						Are you sure you want to delete the server{" "}
						<strong>"{server?.name}"</strong>? This action cannot be undone and
						will disconnect all associated applications.
					</span>
				}
				entityName={server?.name || "server"}
				mutationFn={async () => {
					await deleteServerMutation.mutateAsync({ id: serverId });
					navigate({ to: "/servers" });
					queryClient.invalidateQueries({
						queryKey: trpc.mcpServer.list.queryKey(),
					});
				}}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				isDanger={true}
				buttonText="Delete Server"
				showToast={true}
				onError={(error) => {
					console.error("Failed to delete server:", error);
				}}
			/>
		</div>
	);
}
