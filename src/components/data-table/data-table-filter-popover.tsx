"use client";

import type { Column, Table } from "@tanstack/react-table";
import { Check, Filter, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DataTableFilterPopoverProps<TData> {
	column: Column<TData>;
	title?: string;
	options: Array<{ label: string; value: string; count?: number }>;
	selectedValues?: string[];
	onSelectionChange?: (values: string[]) => void;
}

export function DataTableFilterPopover<TData>({
	column,
	title,
	options,
	selectedValues = [],
	onSelectionChange,
}: DataTableFilterPopoverProps<TData>) {
	const [open, setOpen] = React.useState(false);
	const [localSelectedValues, setLocalSelectedValues] = React.useState<
		Set<string>
	>(new Set(selectedValues));

	// Sync local state with props
	React.useEffect(() => {
		setLocalSelectedValues(new Set(selectedValues));
	}, [selectedValues]);

	const handleSelect = (value: string) => {
		const newSet = new Set(localSelectedValues);
		if (newSet.has(value)) {
			newSet.delete(value);
		} else {
			newSet.add(value);
		}
		setLocalSelectedValues(newSet);

		// Update column filter immediately
		const newValues = Array.from(newSet);
		column.setFilterValue(newValues.length > 0 ? newValues : undefined);
		onSelectionChange?.(newValues);
	};

	const handleClear = () => {
		setLocalSelectedValues(new Set());
		column.setFilterValue(undefined);
		onSelectionChange?.([]);
	};

	const selectedCount = localSelectedValues.size;
	const Icon = column.columnDef.meta?.icon || Filter;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={cn(
						"border-dashed",
						selectedCount > 0 && "border-solid bg-accent font-medium",
					)}
				>
					<Icon className="mr-2 h-4 w-4" />
					{title}
					{selectedCount > 0 && (
						<>
							<div className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
								{selectedCount}
							</div>
							<button
								type="button"
								aria-label={`Clear ${title} filter`}
								className="ml-2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								onClick={(e) => {
									e.stopPropagation();
									handleClear();
								}}
							>
								<X className="h-3 w-3" />
							</button>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<Command>
					<CommandInput placeholder={`Search ${title?.toLowerCase()}...`} />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = localSelectedValues.has(option.value);
								return (
									<CommandItem
										key={option.value}
										onSelect={() => handleSelect(option.value)}
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												isSelected
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible",
											)}
										>
											<Check className="h-4 w-4" />
										</div>
										<span className="flex-1">{option.label}</span>
										{option.count && (
											<span className="ml-auto text-xs text-muted-foreground">
												{option.count}
											</span>
										)}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

interface DataTableMultiFilterProps<TData> {
	table: Table<TData>;
	selectedFilters?: Array<{
		columnId: string;
		values: string[];
	}>;
}

export function DataTableMultiFilter<TData>({
	table,
	selectedFilters = [],
}: DataTableMultiFilterProps<TData>) {
	const filterableColumns = table.getAllColumns().filter((column) => {
		const meta = column.columnDef.meta;
		return (
			column.columnDef.enableColumnFilter &&
			meta?.variant === "multiSelect" &&
			meta?.options?.length
		);
	});

	if (filterableColumns.length === 0) {
		return null;
	}

	return (
		<div className="flex items-center space-x-2">
			{filterableColumns.map((column) => {
				const meta = column.columnDef.meta;
				const currentFilter = selectedFilters.find(
					(f) => f.columnId === column.id,
				);

				return (
					<DataTableFilterPopover
						key={column.id}
						column={column}
						title={meta?.label || column.id}
						options={meta?.options || []}
						selectedValues={currentFilter?.values || []}
					/>
				);
			})}
		</div>
	);
}
