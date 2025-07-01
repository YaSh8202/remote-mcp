import { AppLogo } from "@/components/AppLogo";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppConnectionStatus } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Edit, Link, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConnectionsTableToolbar } from "./connections-table-toolbar";

export interface ConnectionWithUsage {
	id: string;
	displayName: string;
	appName: string;
	type: string;
	status: AppConnectionStatus;
	createdAt: Date;
	updatedAt: Date;
	usageCount: number;
}

interface ConnectionsTableProps {
	data: ConnectionWithUsage[];
	onEdit?: (connection: ConnectionWithUsage) => void;
	onDelete?: (connection: ConnectionWithUsage) => void;
	onCreateConnection?: () => void;
}

export function ConnectionsTable({
	data,
	onEdit,
	onDelete,
	onCreateConnection,
}: ConnectionsTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

	const trpc = useTRPC();

	// Fetch available apps for metadata
	const { data: availableApps } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	// Get app metadata for logos
	const getAppMetadata = (appName: string) => {
		return availableApps?.find((app) => app.name === appName);
	};

	const getStatusBadge = (status: AppConnectionStatus) => {
		switch (status) {
			case "ACTIVE":
				return (
					<Badge
						variant="default"
						className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
					>
						Active
					</Badge>
				);
			case "ERROR":
				return <Badge variant="destructive">Error</Badge>;
			case "MISSING":
				return <Badge variant="secondary">Missing</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const columns: ColumnDef<ConnectionWithUsage>[] = [
		{
			accessorKey: "appName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="App" />
			),
			cell: ({ row }) => {
				const appName = row.getValue("appName") as string;
				const metadata = getAppMetadata(appName);

				return (
					<div className="flex items-center gap-3">
						<div className="flex-shrink-0">
							{metadata?.logo ? (
								<AppLogo
									logo={metadata.logo}
									appName={appName}
									className="h-8 w-8 rounded"
								/>
							) : (
								<div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
									<Link className="h-4 w-4 text-muted-foreground" />
								</div>
							)}
						</div>

						<div className="font-medium">
							{metadata?.displayName || appName}
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "displayName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Name" />
			),
			cell: ({ row }) => {
				return <div className="font-medium">{row.getValue("displayName")}</div>;
			},
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Status" />
			),
			cell: ({ row }) => {
				const status = row.getValue("status") as AppConnectionStatus;
				return getStatusBadge(status);
			},
			filterFn: (row, id, value) => {
				return value.includes(row.getValue(id));
			},
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Connected At" />
			),
			cell: ({ row }) => {
				const date = row.getValue("createdAt") as Date;
				return (
					<div className="text-sm">
						{formatDistanceToNow(date, { addSuffix: true })}
					</div>
				);
			},
		},
		{
			accessorKey: "usageCount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Usage Count" />
			),
			cell: ({ row }) => {
				const count = row.getValue("usageCount") as number;
				return (
					<div className="text-center">
						<Badge variant="outline" className="font-mono">
							{count}
						</Badge>
					</div>
				);
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const connection = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
							>
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[160px]">
							<DropdownMenuItem
								onClick={() => onEdit?.(connection)}
								className="cursor-pointer"
							>
								<Edit className="mr-2 h-4 w-4" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => onDelete?.(connection)}
								className="cursor-pointer text-destructive focus:text-destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
			columnFilters,
			columnVisibility,
		},
	});

	return (
		<div className="space-y-4">
			<ConnectionsTableToolbar
				table={table}
				onCreateConnection={onCreateConnection}
			/>
			<DataTable table={table} />
		</div>
	);
}
