import { NewConnectionDialog } from "@/components/app-connection/new-connection-dialog";
import { ConfirmationDeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Link2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type ConnectionWithUsage,
	ConnectionsTable,
} from "./-components/connections-table";
import { EditConnectionDialog } from "./-components/edit-connection-dialog";

export const Route = createFileRoute("/_authed/connections/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedConnection, setSelectedConnection] =
		useState<ConnectionWithUsage | null>(null);

	const trpc = useTRPC();

	// Fetch connections with usage count
	const {
		data: connections,
		isLoading,
		refetch,
	} = useQuery(trpc.appConnection.getAllConnectionsWithUsage.queryOptions());

	// Fetch available apps for the new connection dialog
	const { data: availableApps } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	// Delete connection mutation
	const deleteConnectionMutation = useMutation({
		...trpc.appConnection.delete.mutationOptions(),
		onSuccess: () => {
			toast.success("Connection deleted successfully!");
			setDeleteDialogOpen(false);
			setSelectedConnection(null);
			refetch();
		},
		onError: (error) => {
			toast.error(`Failed to delete connection: ${error.message}`);
		},
	});

	// Configure page header
	usePageHeader({
		breadcrumbs: [{ label: "Connections" }],
		actions: [
			{
				id: "new-connection",
				label: "New Connection",
				icon: <Plus className="h-4 w-4" />,
				onClick: () => setCreateDialogOpen(true),
			},
		],
	});

	const handleCreateConnection = () => {
		setCreateDialogOpen(true);
	};

	const handleCreateSuccess = () => {
		refetch();
		toast.success("Connection created successfully!");
	};

	const handleEdit = (connection: ConnectionWithUsage) => {
		setSelectedConnection(connection);
		setEditDialogOpen(true);
	};

	const handleEditSuccess = () => {
		refetch();
		toast.success("Connection updated successfully!");
	};

	const handleDelete = (connection: ConnectionWithUsage) => {
		setSelectedConnection(connection);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedConnection) return;

		deleteConnectionMutation.mutate({
			id: selectedConnection.id,
		});
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-6 space-y-8">
				{/* Page Heading Skeleton */}
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
				</div>

				<Card>
					<CardContent className="p-6">
						<div className="space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center space-x-4">
									<Skeleton className="h-12 w-12 rounded" />
									<div className="space-y-2 flex-1">
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-3 w-32" />
									</div>
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-6 w-20" />
									<Skeleton className="h-8 w-8" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const connectionsData = connections || [];
	const firstApp = availableApps?.[0];

	return (
		<div className="container mx-auto p-6 space-y-8">
			{/* Page Heading */}
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
					<Link2 className="h-6 w-6" />
					Connections{" "}
					{connectionsData.length > 0 && `(${connectionsData.length})`}
				</h1>
				<p className="text-muted-foreground">
					Manage application connections and view their usage across MCP servers
				</p>
			</div>

			{/* Main Content */}
			{connectionsData.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<div className="p-4 bg-muted rounded-full w-16 h-16 mb-4 flex items-center justify-center">
							<Link2 className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold mb-2">No connections yet</h3>
						<p className="text-muted-foreground mb-4 text-center max-w-md">
							Create your first connection to start integrating applications
							with your MCP servers.
						</p>
						<Button onClick={handleCreateConnection} className="gap-2">
							<Plus className="h-4 w-4" />
							Create Your First Connection
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					<ConnectionsTable
						data={connectionsData}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onCreateConnection={handleCreateConnection}
					/>
				</div>
			)}

			{/* Dialogs */}
			{firstApp?.auth && (
				<NewConnectionDialog
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					app={firstApp}
					onSave={handleCreateSuccess}
				/>
			)}

			<EditConnectionDialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				connection={selectedConnection}
				onSave={handleEditSuccess}
			/>

			<ConfirmationDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Delete Connection"
				message={
					selectedConnection ? (
						<>
							Are you sure you want to delete the connection{" "}
							<strong>{selectedConnection.displayName}</strong>? This action
							cannot be undone.
							{selectedConnection.usageCount > 0 && (
								<div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
									<strong>Warning:</strong> This connection is currently used by{" "}
									{selectedConnection.usageCount} MCP server(s). Deleting it may
									break those integrations.
								</div>
							)}
						</>
					) : (
						"Are you sure you want to delete this connection?"
					)
				}
				entityName={selectedConnection?.displayName || "connection"}
				mutationFn={handleDeleteConfirm}
				isDanger={true}
				buttonText="Delete Connection"
			/>
		</div>
	);
}
