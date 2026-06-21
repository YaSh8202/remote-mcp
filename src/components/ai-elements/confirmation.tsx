"use client";

import type { ToolUIPart } from "ai";
import { CheckCircle2Icon, ShieldAlertIcon, XCircleIcon } from "lucide-react";
import {
	type ComponentProps,
	createContext,
	type ReactNode,
	useContext,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToolUIPartApproval =
	| {
			id: string;
			approved?: never;
			reason?: never;
	  }
	| {
			id: string;
			approved: boolean;
			reason?: string;
	  }
	| {
			id: string;
			approved: true;
			reason?: string;
	  }
	| {
			id: string;
			approved: true;
			reason?: string;
	  }
	| {
			id: string;
			approved: false;
			reason?: string;
	  }
	| undefined;

type ConfirmationContextValue = {
	approval: ToolUIPartApproval;
	state: ToolUIPart["state"];
};

const ConfirmationContext = createContext<ConfirmationContextValue | null>(
	null,
);

const useConfirmation = () => {
	const context = useContext(ConfirmationContext);

	if (!context) {
		throw new Error("Confirmation components must be used within Confirmation");
	}

	return context;
};

export type ConfirmationProps = ComponentProps<"div"> & {
	approval?: ToolUIPartApproval;
	state: ToolUIPart["state"];
};

export const Confirmation = ({
	className,
	approval,
	state,
	...props
}: ConfirmationProps) => {
	// Only render the approval bar while a decision is pending. Once resolved, the
	// header status badge (Completed / Denied) already conveys the outcome.
	if (!approval || state !== "approval-requested") {
		return null;
	}

	return (
		<ConfirmationContext.Provider value={{ approval, state }}>
			<div
				className={cn(
					"flex flex-col gap-3 border-amber-500/20 border-t bg-amber-500/[0.04] px-3.5 py-2.5",
					className,
				)}
				{...props}
			/>
		</ConfirmationContext.Provider>
	);
};

export type ConfirmationTitleProps = ComponentProps<"div">;

export const ConfirmationTitle = ({
	className,
	children,
	...props
}: ConfirmationTitleProps) => (
	<div
		className={cn("flex items-center gap-2 text-sm", className)}
		{...props}
	>
		<ShieldAlertIcon className="size-4 shrink-0 text-amber-500" />
		<span className="text-foreground">{children}</span>
	</div>
);

export type ConfirmationRequestProps = {
	children?: ReactNode;
};

export const ConfirmationRequest = ({ children }: ConfirmationRequestProps) => {
	const { state } = useConfirmation();

	// Only show when approval is requested
	if (state !== "approval-requested") {
		return null;
	}

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			{children}
		</div>
	);
};

export type ConfirmationAcceptedProps = {
	children?: ReactNode;
};

export const ConfirmationAccepted = ({
	children,
}: ConfirmationAcceptedProps) => {
	const { approval, state } = useConfirmation();

	// Only show when approved and in response states
	if (
		!approval?.approved ||
		(state !== "approval-responded" &&
			state !== "output-denied" &&
			state !== "output-available")
	) {
		return null;
	}

	return (
		<div className="flex items-center gap-2 text-emerald-600 text-sm dark:text-emerald-400">
			<CheckCircle2Icon className="size-4 shrink-0" />
			<span>{children}</span>
		</div>
	);
};

export type ConfirmationRejectedProps = {
	children?: ReactNode;
};

export const ConfirmationRejected = ({
	children,
}: ConfirmationRejectedProps) => {
	const { approval, state } = useConfirmation();

	// Only show when rejected and in response states
	if (
		approval?.approved !== false ||
		(state !== "approval-responded" &&
			state !== "output-denied" &&
			state !== "output-available")
	) {
		return null;
	}

	return (
		<div className="flex items-center gap-2 text-red-600 text-sm dark:text-red-400">
			<XCircleIcon className="size-4 shrink-0" />
			<span>{children}</span>
		</div>
	);
};

export type ConfirmationActionsProps = ComponentProps<"div">;

export const ConfirmationActions = ({
	className,
	...props
}: ConfirmationActionsProps) => {
	const { state } = useConfirmation();

	// Only show when approval is requested
	if (state !== "approval-requested") {
		return null;
	}

	return (
		<div
			className={cn("flex shrink-0 items-center gap-2", className)}
			{...props}
		/>
	);
};

export type ConfirmationActionProps = ComponentProps<typeof Button>;

export const ConfirmationAction = ({
	className,
	...props
}: ConfirmationActionProps) => (
	<Button
		className={cn("h-8 gap-1.5 px-3 text-sm", className)}
		size="sm"
		type="button"
		{...props}
	/>
);
