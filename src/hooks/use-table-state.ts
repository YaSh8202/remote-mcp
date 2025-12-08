import { useNavigate, useSearch } from "@tanstack/react-router";
import type {
	ColumnFiltersState,
	PaginationState,
	SortingState,
	Updater,
	VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { useDebounce } from "@/hooks/use-debounce";

export interface TableSearchParams {
	page: number;
	limit: number;
	search?: string;
	status: string[];
	server: string[];
	app: string[];
	sort: Array<{ id: string; desc: boolean }>;
}

interface UseTableStateOptions {
	defaultPageSize?: number;
	debounceMs?: number;
}

export function useTableState({
	defaultPageSize = 10,
	debounceMs = 300,
}: UseTableStateOptions) {
	const navigate = useNavigate();
	const searchParams = useSearch({ strict: false }) as TableSearchParams;

	// Local state for immediate UI updates
	const [globalFilter, setGlobalFilter] = React.useState(
		searchParams.search || "",
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	// Debounced search value for API calls
	const debouncedGlobalFilter = useDebounce(globalFilter, debounceMs);

	// Convert URL params to table state
	const columnFilters = React.useMemo((): ColumnFiltersState => {
		const filters: ColumnFiltersState = [];

		if (searchParams.status?.length) {
			filters.push({ id: "status", value: searchParams.status });
		}
		if (searchParams.server?.length) {
			filters.push({ id: "server", value: searchParams.server });
		}
		if (searchParams.app?.length) {
			filters.push({ id: "app", value: searchParams.app });
		}

		return filters;
	}, [searchParams.status, searchParams.server, searchParams.app]);

	const sorting = React.useMemo((): SortingState => {
		return searchParams.sort || [{ id: "createdAt", desc: true }];
	}, [searchParams.sort]);

	const pagination = React.useMemo((): PaginationState => {
		return {
			pageIndex: (searchParams.page || 1) - 1,
			pageSize: searchParams.limit || defaultPageSize,
		};
	}, [searchParams.page, searchParams.limit, defaultPageSize]);

	// Update URL function
	const updateSearchParams = React.useCallback(
		(updates: Partial<TableSearchParams>) => {
			const currentSearch = searchParams;
			const newSearchParams = { ...currentSearch, ...updates };

			// Clean up undefined/empty values
			for (const key of Object.keys(newSearchParams) as Array<
				keyof TableSearchParams
			>) {
				const value = newSearchParams[key];
				if (
					value === undefined ||
					value === "" ||
					(Array.isArray(value) && value.length === 0)
				) {
					delete newSearchParams[key];
				}
			}

			navigate({
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				search: newSearchParams as any,
				replace: true,
			});
		},
		[navigate, searchParams],
	);

	// Handlers for table state changes
	const handleColumnFiltersChange = React.useCallback(
		(updater: Updater<ColumnFiltersState>) => {
			const newFilters =
				typeof updater === "function" ? updater(columnFilters) : updater;

			const updates: Partial<TableSearchParams> = {
				page: 1, // Reset to first page when filtering
			};

			// Extract filter values
			const statusFilter = newFilters.find((f) => f.id === "status")?.value;
			const serverFilter = newFilters.find((f) => f.id === "server")?.value;
			const appFilter = newFilters.find((f) => f.id === "app")?.value;

			updates.status =
				Array.isArray(statusFilter) && statusFilter.length ? statusFilter : [];
			updates.server =
				Array.isArray(serverFilter) && serverFilter.length ? serverFilter : [];
			updates.app =
				Array.isArray(appFilter) && appFilter.length ? appFilter : [];

			updateSearchParams(updates);
		},
		[columnFilters, updateSearchParams],
	);

	const handleSortingChange = React.useCallback(
		(updater: Updater<SortingState>) => {
			const newSorting =
				typeof updater === "function" ? updater(sorting) : updater;
			updateSearchParams({ sort: newSorting });
		},
		[sorting, updateSearchParams],
	);

	const handlePaginationChange = React.useCallback(
		(updater: Updater<PaginationState>) => {
			const newPagination =
				typeof updater === "function" ? updater(pagination) : updater;
			updateSearchParams({
				page: newPagination.pageIndex + 1,
				limit: newPagination.pageSize,
			});
		},
		[pagination, updateSearchParams],
	);

	// Sync debounced search with URL
	React.useEffect(() => {
		if (debouncedGlobalFilter !== searchParams.search) {
			updateSearchParams({
				search: debouncedGlobalFilter || undefined,
				page: 1, // Reset to first page when searching
			});
		}
	}, [debouncedGlobalFilter, searchParams.search, updateSearchParams]);

	return {
		// Table state
		columnFilters,
		sorting,
		pagination,
		globalFilter,
		columnVisibility,
		rowSelection,
		debouncedGlobalFilter,

		// Setters
		setGlobalFilter,
		setColumnVisibility,
		setRowSelection,

		// Handlers for table
		onColumnFiltersChange: handleColumnFiltersChange,
		onSortingChange: handleSortingChange,
		onPaginationChange: handlePaginationChange,

		// Search params for API calls
		searchParams,
	};
}
