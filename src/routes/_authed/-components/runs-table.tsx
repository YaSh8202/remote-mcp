import { useQuery } from "@tanstack/react-query";
import {
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Card } from "@/components/ui/card";
import { McpRunStatus } from "@/db/schema";
import { createFilterOptions } from "@/hooks/use-generic-table";
import { useRunsTable } from "@/hooks/use-runs-table";
import { useTRPC } from "@/integrations/trpc/react";
import { RunDetailsSheet } from "./run-details-sheet";
import { createRunsColumns } from "./runs-columns";
import { RunsTableSkeleton } from "./runs-table-skeleton";

export function RunsTable() {
	const trpc = useTRPC();
	const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);

	// Fetch available apps metadata
	const { data: availableApps } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	// Fetch all servers for filter options (independent of current filter state)
	const { data: allServers } = useQuery(trpc.mcpServer.list.queryOptions());

	// Create app metadata map
	const appMetadata = React.useMemo(() => {
		if (!availableApps) return {};

		const metadataMap: Record<string, (typeof availableApps)[0]> = {};
		for (const app of availableApps) {
			metadataMap[app.name] = app;
		}
		return metadataMap;
	}, [availableApps]);

	// Table state management with URL sync
	const tableState = useRunsTable();

	// Fetch runs data
	const queryParams = React.useMemo(() => {
		const params = {
			page: tableState.searchParams.page || 1,
			limit: tableState.searchParams.limit || 10,
			search: tableState.debouncedGlobalFilter,
			status: (tableState.searchParams.status || []).filter(
				(s: string): s is McpRunStatus =>
					Object.values(McpRunStatus).includes(s as McpRunStatus),
			),
			server: tableState.searchParams.server || [],
			app: tableState.searchParams.app || [],
			sort: tableState.searchParams.sort || [{ id: "createdAt", desc: true }],
		};

		return params;
	}, [
		tableState.searchParams.page,
		tableState.searchParams.limit,
		tableState.debouncedGlobalFilter,
		tableState.searchParams.status,
		tableState.searchParams.server,
		tableState.searchParams.app,
		tableState.searchParams.sort,
	]);

	const {
		data,
		isFetching: isLoading,
		error,
	} = useQuery(trpc.mcpRun.list.queryOptions(queryParams));

	// Generate filter options from all available data (independent of current filters)
	const filterOptions = React.useMemo(() => {
		// Server options from all servers
		const servers = createFilterOptions(allServers, {
			getValue: (server) => server.id,
			getLabel: (server) => {
				// Handle duplicate server names
				const serversWithSameName =
					allServers?.filter((s) => s.name === server.name) || [];
				if (serversWithSameName.length > 1) {
					const index = serversWithSameName.findIndex(
						(s) => s.id === server.id,
					);
					return `${server.name} (${index + 1})`;
				}
				return server.name;
			},
		});

		// App options from current data
		const apps = createFilterOptions(data?.data, {
			getValue: (run: { app?: { appName?: string } }) => run.app?.appName || "",
			getLabel: (run: { app?: { appName?: string } }) => {
				const appName = run.app?.appName;
				if (!appName) return "";
				const metadata = appMetadata[appName];
				return metadata?.displayName || appName;
			},
		}).filter((option) => option.value); // Remove empty values

		return { servers, apps };
	}, [allServers, data?.data, appMetadata]);

	// Create columns with app metadata and filter options (recreate when filter options change)
	const columnsWithFilters = React.useMemo(
		() =>
			createRunsColumns(
				(appName: string) => appMetadata[appName],
				filterOptions,
				setSelectedRunId,
			),
		[appMetadata, filterOptions],
	);

	// Initialize table
	const table = useReactTable({
		data: data?.data || [],
		columns: columnsWithFilters,
		pageCount: data?.totalPages || -1,
		state: {
			sorting: tableState.sorting,
			columnVisibility: tableState.columnVisibility,
			rowSelection: tableState.rowSelection,
			columnFilters: tableState.columnFilters,
			pagination: tableState.pagination,
			globalFilter: tableState.globalFilter,
		},
		enableRowSelection: true,
		onRowSelectionChange: tableState.setRowSelection,
		onSortingChange: tableState.onSortingChange,
		onColumnFiltersChange: tableState.onColumnFiltersChange,
		onColumnVisibilityChange: tableState.setColumnVisibility,
		onGlobalFilterChange: tableState.setGlobalFilter,
		onPaginationChange: tableState.onPaginationChange,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true,
	});

	if (isLoading) {
		return <RunsTableSkeleton />;
	}

	if (error) {
		return (
			<Card className="p-6">
				<div className="text-center text-muted-foreground">
					<p>Failed to load runs: {error.message}</p>
				</div>
			</Card>
		);
	}

	if (
		!data?.data?.length &&
		!tableState.globalFilter &&
		!tableState.columnFilters.length
	) {
		return (
			<Card className="p-6">
				<div className="text-center text-muted-foreground">
					<p>No runs found. Execute some MCP tools to see them here.</p>
				</div>
			</Card>
		);
	}

	return (
		<div className="w-full space-y-4">
			<DataTable table={table} className="w-full">
				<DataTableToolbar table={table} />
			</DataTable>

			{selectedRunId && (
				<RunDetailsSheet
					runId={selectedRunId}
					open={!!selectedRunId}
					onOpenChange={(open) => {
						if (!open) {
							setSelectedRunId(null);
						}
					}}
				/>
			)}
		</div>
	);
}
