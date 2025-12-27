import type { ColumnSort, Row, RowData } from "@tanstack/react-table";
import { z } from "zod/v4";
import { type DataTableConfig, dataTableConfig } from "@/config/data-table";

const filterItemSchema = z.object({
	id: z.string(),
	value: z.union([z.string(), z.array(z.string())]),
	variant: z.enum(dataTableConfig.filterVariants),
	operator: z.enum(dataTableConfig.operators),
	filterId: z.string(),
});

export type FilterItemSchema = z.infer<typeof filterItemSchema>;

declare module "@tanstack/react-table" {
	interface ColumnMeta<_TData extends RowData, _TValue> {
		label?: string;
		placeholder?: string;
		variant?: FilterVariant;
		options?: Option[];
		range?: [number, number];
		unit?: string;
		icon?: React.FC<React.SVGProps<SVGSVGElement>>;
	}
}

export interface Option {
	label: string;
	value: string;
	count?: number;
	icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
	id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
	id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData> {
	row: Row<TData>;
	variant: "update" | "delete";
}
