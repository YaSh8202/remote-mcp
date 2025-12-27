import type { ComponentProps, ReactNode } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type ToolSelectorProps = ComponentProps<typeof Dialog>;

export const ToolSelector = (props: ToolSelectorProps) => <Dialog {...props} />;

export type ToolSelectorTriggerProps = ComponentProps<typeof DialogTrigger>;

export const ToolSelectorTrigger = (props: ToolSelectorTriggerProps) => (
	<DialogTrigger {...props} />
);

export type ToolSelectorContentProps = ComponentProps<typeof DialogContent> & {
	title?: ReactNode;
};

export const ToolSelectorContent = ({
	className,
	children,
	title = "Select Tools",
	...props
}: ToolSelectorContentProps) => (
	<DialogContent className={cn("p-0", className)} {...props}>
		<DialogTitle className="sr-only">{title}</DialogTitle>
		<Command className="**:data-[slot=command-input-wrapper]:h-auto">
			{children}
		</Command>
	</DialogContent>
);

export type ToolSelectorInputProps = ComponentProps<typeof CommandInput>;

export const ToolSelectorInput = ({
	className,
	...props
}: ToolSelectorInputProps) => (
	<CommandInput className={cn("h-auto py-3.5", className)} {...props} />
);

export type ToolSelectorListProps = ComponentProps<typeof CommandList>;

export const ToolSelectorList = (props: ToolSelectorListProps) => (
	<CommandList {...props} />
);

export type ToolSelectorEmptyProps = ComponentProps<typeof CommandEmpty>;

export const ToolSelectorEmpty = (props: ToolSelectorEmptyProps) => (
	<CommandEmpty {...props} />
);

export type ToolSelectorGroupProps = ComponentProps<typeof CommandGroup>;

export const ToolSelectorGroup = ({
	className,
	...props
}: ToolSelectorGroupProps) => (
	<CommandGroup className={cn("px-2", className)} {...props} />
);

export type ToolSelectorItemProps = ComponentProps<typeof CommandItem> & {
	selected?: boolean;
};

export const ToolSelectorItem = ({
	className,
	selected,
	children,
	...props
}: ToolSelectorItemProps) => (
	<CommandItem
		className={cn(
			"flex items-center gap-2 rounded-md px-2 py-1.5",
			selected && "bg-accent",
			className,
		)}
		{...props}
	>
		{children}
	</CommandItem>
);

export type ToolSelectorCheckboxProps = ComponentProps<typeof Checkbox>;

export const ToolSelectorCheckbox = ({
	className,
	...props
}: ToolSelectorCheckboxProps) => (
	<Checkbox className={cn("size-4", className)} {...props} />
);

export type ToolSelectorSeparatorProps = ComponentProps<
	typeof CommandSeparator
>;

export const ToolSelectorSeparator = (props: ToolSelectorSeparatorProps) => (
	<CommandSeparator {...props} />
);

export type ToolSelectorIconProps = ComponentProps<"span">;

export const ToolSelectorIcon = ({
	className,
	...props
}: ToolSelectorIconProps) => (
	<span
		className={cn(
			"flex size-5 shrink-0 items-center justify-center text-muted-foreground",
			className,
		)}
		{...props}
	/>
);

export type ToolSelectorNameProps = ComponentProps<"span">;

export const ToolSelectorName = ({
	className,
	...props
}: ToolSelectorNameProps) => (
	<span className={cn("font-medium truncate", className)} {...props} />
);

export type ToolSelectorDescriptionProps = ComponentProps<"span">;

export const ToolSelectorDescription = ({
	className,
	...props
}: ToolSelectorDescriptionProps) => (
	<span
		className={cn("text-xs text-muted-foreground truncate", className)}
		{...props}
	/>
);

export type ToolSelectorHeaderProps = ComponentProps<"div">;

export const ToolSelectorHeader = ({
	className,
	...props
}: ToolSelectorHeaderProps) => (
	<div
		className={cn(
			"flex items-center justify-between px-4 py-2 border-b",
			className,
		)}
		{...props}
	/>
);

export type ToolSelectorCountProps = ComponentProps<"span">;

export const ToolSelectorCount = ({
	className,
	...props
}: ToolSelectorCountProps) => (
	<span
		className={cn(
			"text-sm font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded",
			className,
		)}
		{...props}
	/>
);

export type ToolSelectorServerProps = ComponentProps<"div"> & {
	expanded?: boolean;
};

export const ToolSelectorServer = ({
	className,
	expanded,
	...props
}: ToolSelectorServerProps) => (
	<div className={cn("flex flex-col", className)} {...props} />
);

export type ToolSelectorServerHeaderProps = ComponentProps<"button">;

export const ToolSelectorServerHeader = ({
	className,
	...props
}: ToolSelectorServerHeaderProps) => (
	<button
		type="button"
		className={cn(
			"flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-md transition-colors w-full text-left",
			className,
		)}
		{...props}
	/>
);

export type ToolSelectorServerNameProps = ComponentProps<"span">;

export const ToolSelectorServerName = ({
	className,
	...props
}: ToolSelectorServerNameProps) => (
	<span className={cn("font-medium flex-1", className)} {...props} />
);

export type ToolSelectorToolInfoProps = ComponentProps<"div">;

export const ToolSelectorToolInfo = ({
	className,
	...props
}: ToolSelectorToolInfoProps) => (
	<div className={cn("flex flex-col flex-1 min-w-0", className)} {...props} />
);
