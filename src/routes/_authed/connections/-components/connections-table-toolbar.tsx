import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/integrations/trpc/react";
import { useQuery } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import { Plus, Search, X } from "lucide-react";
import type { ConnectionWithUsage } from "./connections-table";

interface ConnectionsTableToolbarProps {
	table: Table<ConnectionWithUsage>;
	onCreateConnection?: () => void;
}

export function ConnectionsTableToolbar({
	table,
	onCreateConnection,
}: ConnectionsTableToolbarProps) {
	const isFiltered = table.getState().columnFilters.length > 0;

	const trpc = useTRPC();

	// Fetch available apps from the server
	const { data: availableApps } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	// Get unique app options for filtering
	const appOptions =
		availableApps?.map((app) => ({
			label: app.displayName,
			value: app.name,
			icon: undefined, // We could add an icon component here if needed
		})) || [];

	const statusOptions = [
		{
			label: "Active",
			value: "ACTIVE",
		},
		{
			label: "Error",
			value: "ERROR",
		},
		{
			label: "Missing",
			value: "MISSING",
		},
	];

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				<div className="relative">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search connections..."
						value={
							(table.getColumn("displayName")?.getFilterValue() as string) ?? ""
						}
						onChange={(event) =>
							table.getColumn("displayName")?.setFilterValue(event.target.value)
						}
						className="pl-8 max-w-sm"
					/>
				</div>

				{table.getColumn("appName") && (
					<DataTableFacetedFilter
						column={table.getColumn("appName")}
						title="App"
						options={appOptions}
					/>
				)}

				{table.getColumn("status") && (
					<DataTableFacetedFilter
						column={table.getColumn("status")}
						title="Status"
						options={statusOptions}
					/>
				)}

				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => table.resetColumnFilters()}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>

			<div className="flex items-center space-x-2">
				<DataTableViewOptions table={table} />
				<Button onClick={onCreateConnection} className="gap-2">
					<Plus className="h-4 w-4" />
					New Connection
				</Button>
			</div>
		</div>
	);
}
