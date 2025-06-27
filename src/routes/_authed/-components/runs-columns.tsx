import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import { AppLogo } from "@/components/AppLogo";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { McpRun } from "@/db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Bot, CircleDashed, Eye, Server } from "lucide-react";

export type RunsTableData = McpRun & {
	server: {
		id: string;
		name: string;
	};
	app: {
		id: string;
		appName: string;
	};
};

export const createRunsColumns = (
	getAppMetadata: (appName: string) => McpAppMetadata | undefined,
	filterOptions?: {
		servers?: Array<{ label: string; value: string }>;
		apps?: Array<{ label: string; value: string }>;
		tools?: Array<{ label: string; value: string }>;
	},
	onShowRunDetails?: (runId: string) => void,
): ColumnDef<RunsTableData>[] => [
	{
		accessorKey: "server.id",
		id: "server",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Server" />
		),
		cell: ({ row }) => {
			const serverName = row.original.server.name;
			return (
				<div className="font-medium text-muted-foreground">{serverName}</div>
			);
		},
		meta: {
			label: "Server",
			variant: "multiSelect",
			options: filterOptions?.servers || [],
			icon: Server,
		},
		enableColumnFilter: true,
		enableSorting: false,
		filterFn: (row, _id, value) => {
			const serverId = row.original.server.id;
			return value.includes(serverId);
		},
	},
	{
		accessorKey: "app.appName",
		id: "app",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="App" />
		),
		cell: ({ row }) => {
			const appName = row.original.app.appName;
			const appMetadata = getAppMetadata(appName);

			return (
				<div className="flex items-center gap-2">
					{appMetadata ? (
						<AppLogo
							logo={appMetadata.logo}
							appName={appMetadata.displayName}
							className="h-5 w-5"
						/>
					) : (
						<div className="h-5 w-5 rounded bg-muted flex items-center justify-center text-xs font-medium">
							{appName.charAt(0).toUpperCase()}
						</div>
					)}
					<span className="font-medium text-muted-foreground">
						{appMetadata?.displayName || appName}
					</span>
				</div>
			);
		},
		meta: {
			label: "App",
			variant: "multiSelect",
			options: filterOptions?.apps || [],
			icon: Bot,
		},
		enableColumnFilter: true,
		enableSorting: false,
		filterFn: (row, _id, value) => {
			const appName = row.original.app.appName;
			return value.includes(appName);
		},
	},
	{
		accessorKey: "toolName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tool" />
		),
		cell: ({ row }) => {
			const toolName = row.getValue("toolName") as string;
			return <div className="font-medium">{toolName}</div>;
		},
		enableColumnFilter: false,
		enableSorting: true,
		enableHiding: false,
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge
					variant={status === "SUCCESS" ? "default" : "destructive"}
					className="capitalize"
				>
					{status.toLowerCase()}
				</Badge>
			);
		},
		meta: {
			label: "Status",
			variant: "multiSelect",
			options: [
				{
					label: "Success",
					value: "SUCCESS",
					icon: CircleDashed,
				},
				{
					label: "Failed",
					value: "FAILED",
					icon: CircleDashed,
				},
			],
			icon: CircleDashed,
		},
		enableColumnFilter: true,
		enableSorting: true,
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Executed" />
		),
		cell: ({ row }) => {
			const createdAt = row.getValue("createdAt") as Date;
			return (
				<div className="text-muted-foreground">
					{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
				</div>
			);
		},
		enableColumnFilter: false,
		enableSorting: true,
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			return (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						onShowRunDetails?.(row.original.id);
					}}
				>
					<Eye className="h-4 w-4" />
					View
				</Button>
			);
		},
		enableSorting: false,
		enableHiding: false,
	},
];

// Default export for backward compatibility
export const runsColumns = createRunsColumns(() => undefined);
