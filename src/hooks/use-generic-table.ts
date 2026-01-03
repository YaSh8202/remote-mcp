import { useNavigate, useSearch } from "@tanstack/react-router";
import type {
	ColumnFiltersState,
	PaginationState,
	SortingState,
	Updater,
	VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { z } from "zod/v4";
import { useDebounce } from "@/hooks/use-debounce";

// Base search params schema that can be extended
export const baseTableSearchSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
	search: z.string().optional(),
	sort: z
		.array(
			z.object({
				id: z.string(),
				desc: z.boolean(),
			}),
		)
		.default([{ id: "createdAt", desc: true }]),
});

export type BaseTableSearchParams = z.infer<typeof baseTableSearchSchema>;

// Generic filter schema helper
export const createFilterSchema = (filterFields: z.ZodRawShape) => {
	return baseTableSearchSchema.extend(filterFields);
};

interface UseGenericTableOptions {
	// biome-ignore lint/suspicious/noExplicitAny: searchSchema should be flexible
	searchSchema: z.ZodType<any>;
	defaultPageSize?: number;
	debounceMs?: number;
	filterMapping?: Record<string, string>;
}

export function useGenericTable({
	searchSchema,
	defaultPageSize = 10,
	debounceMs = 300,
	filterMapping = {},
}: UseGenericTableOptions) {
	const navigate = useNavigate();
	const rawSearchParams = useSearch({ strict: false });

	// Parse and validate search params
	const searchParams = React.useMemo(() => {
		try {
			return searchSchema.parse(rawSearchParams);
		} catch {
			// Fallback to defaults if parsing fails
			return searchSchema.parse({});
		}
	}, [rawSearchParams, searchSchema]);

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

		// Map filters from search params to column filters
		for (const [columnId, paramKey] of Object.entries(filterMapping)) {
			const value = searchParams[paramKey];
			if (Array.isArray(value) && value.length > 0) {
				filters.push({ id: columnId, value });
			} else if (typeof value === "string" && value) {
				filters.push({ id: columnId, value });
			}
		}

		return filters;
	}, [searchParams, filterMapping]);

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
		// biome-ignore lint/suspicious/noExplicitAny: query params need to be flexible
		(updates: Record<string, any>) => {
			const currentSearch = searchParams;
			const newSearchParams = { ...currentSearch, ...updates };

			// Clean up undefined/empty values
			for (const key of Object.keys(newSearchParams)) {
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
				// biome-ignore lint/suspicious/noExplicitAny: TanStack Router requires any for search params
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

			// biome-ignore lint/suspicious/noExplicitAny: Record<string, any> is needed for search params
			const updates: Record<string, any> = {
				page: 1, // Reset to first page when filtering
			};

			// Map column filters back to search params
			for (const [columnId, paramKey] of Object.entries(filterMapping)) {
				const filter = newFilters.find((f) => f.id === columnId);
				if (filter) {
					updates[paramKey] = filter.value;
				} else {
					updates[paramKey] = [];
				}
			}

			updateSearchParams(updates);
		},
		[columnFilters, updateSearchParams, filterMapping],
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
		const currentSearch = searchParams.search || "";
		if (debouncedGlobalFilter !== currentSearch) {
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
		updateSearchParams,
	};
}

// Helper function to create filter options from data
export function createFilterOptions<T>(
	data: T[] | undefined,
	getters: {
		getValue: (item: T) => string;
		getLabel: (item: T) => string;
		getCount?: (value: string, data: T[]) => number;
	},
): Array<{ label: string; value: string; count?: number }> {
	if (!data?.length) return [];

	const uniqueValues = new Map<string, string>();

	for (const item of data) {
		const value = getters.getValue(item);
		const label = getters.getLabel(item);
		if (value && !uniqueValues.has(value)) {
			uniqueValues.set(value, label);
		}
	}

	return Array.from(uniqueValues.entries()).map(([value, label]) => ({
		value,
		label,
		count: getters.getCount?.(value, data),
	}));
}

// Helper to create table columns with filter metadata
export function createTableColumn(
	// biome-ignore lint/suspicious/noExplicitAny: Column definitions require flexibility
	columnDef: any,
	filterOptions?: {
		variant?: "select" | "multiSelect" | "text" | "number" | "date";
		options?: Array<{ label: string; value: string; count?: number }>;
		icon?: React.FC<React.SVGProps<SVGSVGElement>>;
	},
) {
	return {
		...columnDef,
		meta: {
			...(columnDef.meta || {}),
			...filterOptions,
		},
	};
}
