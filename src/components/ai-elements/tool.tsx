"use client";

import type { ToolUIPart } from "ai";
import {
	CheckCircleIcon,
	ChevronDownIcon,
	CircleIcon,
	ClockIcon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { isValidElement } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

export type ToolProps = ComponentProps<typeof Collapsible> & {
	/** Highlights the card (amber ring) while it waits for the user's decision. */
	awaitingApproval?: boolean;
};

export const Tool = ({ className, awaitingApproval, ...props }: ToolProps) => (
	// Collapsed by default. The Approve/Reject actions live in the header so the
	// user can act without expanding (and the card doesn't get stuck open after
	// resolving). Expand to inspect parameters / result.
	<Collapsible
		className={cn(
			"not-prose group/tool mb-4 w-full overflow-hidden rounded-xl border bg-card/40 shadow-sm transition-colors",
			awaitingApproval &&
				"border-amber-500/40 bg-amber-500/[0.03] ring-1 ring-amber-500/20",
			className,
		)}
		{...props}
	/>
);

export type ToolHeaderProps = {
	title?: string;
	type: ToolUIPart["type"];
	state: ToolUIPart["state"];
	className?: string;
	/** Inline actions (e.g. Approve/Reject) shown in the header, even collapsed. */
	actions?: ReactNode;
};

/** Splits a "namespace-action" tool name into parts for visual hierarchy. */
const splitToolName = (name: string) => {
	const idx = name.indexOf("-");
	if (idx <= 0) return { namespace: null as string | null, action: name };
	return { namespace: name.slice(0, idx), action: name.slice(idx + 1) };
};

const STATUS_CONFIG: Record<
	ToolUIPart["state"],
	{ label: string; icon: ReactNode; className: string }
> = {
	"input-streaming": {
		label: "Pending",
		icon: <CircleIcon className="size-3.5" />,
		className: "bg-muted text-muted-foreground",
	},
	"input-available": {
		label: "Running",
		icon: <ClockIcon className="size-3.5 animate-pulse" />,
		className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
	},
	"approval-requested": {
		label: "Awaiting approval",
		icon: <ClockIcon className="size-3.5" />,
		className:
			"bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25",
	},
	"approval-responded": {
		label: "Responded",
		icon: <CheckCircleIcon className="size-3.5" />,
		className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
	},
	"output-available": {
		label: "Completed",
		icon: <CheckCircleIcon className="size-3.5" />,
		className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
	},
	"output-error": {
		label: "Error",
		icon: <XCircleIcon className="size-3.5" />,
		className: "bg-red-500/10 text-red-600 dark:text-red-400",
	},
	"output-denied": {
		label: "Denied",
		icon: <XCircleIcon className="size-3.5" />,
		className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
	},
};

const getStatusBadge = (status: ToolUIPart["state"]) => {
	const { label, icon, className } = STATUS_CONFIG[status];
	return (
		<Badge
			className={cn(
				"gap-1.5 rounded-full border-transparent px-2 py-0.5 font-medium text-xs",
				className,
			)}
			variant="secondary"
		>
			{icon}
			{label}
		</Badge>
	);
};

export const ToolHeader = ({
	className,
	title,
	type,
	state,
	actions,
	...props
}: ToolHeaderProps) => {
	const name = title ?? type.split("-").slice(1).join("-");
	const { namespace, action } = splitToolName(name);

	return (
		<div
			className={cn(
				"flex w-full items-center gap-2 pr-2.5 pl-3.5",
				className,
			)}
			{...props}
		>
			<CollapsibleTrigger className="-ml-1 flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-3 pl-1 text-left transition-colors hover:opacity-80">
				<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
					<WrenchIcon className="size-3.5" />
				</span>
				<span className="min-w-0 truncate font-medium text-sm">
					{namespace && (
						<span className="text-muted-foreground">{namespace} </span>
					)}
					<span className="text-foreground">{action}</span>
				</span>
				{getStatusBadge(state)}
			</CollapsibleTrigger>
			{actions}
			<CollapsibleTrigger className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60">
				<ChevronDownIcon className="size-4 transition-transform group-data-[state=open]/tool:rotate-180" />
			</CollapsibleTrigger>
		</div>
	);
};

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
	<CollapsibleContent
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		{...props}
	/>
);

export type ToolInputProps = ComponentProps<"div"> & {
	input: ToolUIPart["input"];
};

/**
 * Pretty-prints tool input. Tolerates inputs that arrive as a JSON-encoded
 * string (common with MCP tools) so they don't render as escaped `"{\n ...}"`.
 */
const formatToolValue = (value: unknown): string => {
	if (typeof value === "string") {
		try {
			return JSON.stringify(JSON.parse(value), null, 2);
		} catch {
			return value;
		}
	}
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
};

const isEmptyInput = (input: unknown): boolean => {
	if (input == null) return true;
	if (typeof input === "object") return Object.keys(input).length === 0;
	if (typeof input === "string") return input.trim() === "";
	return false;
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
	<div className={cn("space-y-2 px-3.5 pt-3.5 pb-1", className)} {...props}>
		<h4 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
			Parameters
		</h4>
		{isEmptyInput(input) ? (
			<p className="text-muted-foreground text-sm italic">No parameters</p>
		) : (
			<div className="overflow-hidden break-words rounded-lg border bg-muted/40">
				<CodeBlock code={formatToolValue(input)} language="json" />
			</div>
		)}
	</div>
);

export { formatToolValue };

export type ToolOutputProps = ComponentProps<"div"> & {
	output: ToolUIPart["output"];
	errorText: ToolUIPart["errorText"];
};

export const ToolOutput = ({
	className,
	output,
	errorText,
	...props
}: ToolOutputProps) => {
	if (!(output || errorText)) {
		return null;
	}

	let Output = <div>{output as ReactNode}</div>;

	if (typeof output === "object" && !isValidElement(output)) {
		Output = <CodeBlock code={formatToolValue(output)} language="json" />;
	} else if (typeof output === "string") {
		Output = <CodeBlock code={formatToolValue(output)} language="json" />;
	}

	return (
		<div
			className={cn(
				"max-h-[20rem] space-y-2 overflow-y-auto px-3.5 pt-3.5 pb-3.5",
				className,
			)}
			{...props}
		>
			<h4 className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
				{errorText ? "Error" : "Result"}
			</h4>
			<div
				className={cn(
					"overflow-hidden break-words rounded-md text-xs [&_table]:w-full",
					errorText
						? "bg-destructive/10 text-destructive"
						: "bg-muted/50 text-foreground",
				)}
			>
				{errorText && <div>{errorText}</div>}
				{Output}
			</div>
		</div>
	);
};
