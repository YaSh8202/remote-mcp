"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type SuggestionCardProps = ComponentProps<"button"> & {
	title: string;
	description: string;
};

export const SuggestionCard = ({
	title,
	description,
	className,
	...props
}: SuggestionCardProps) => {
	return (
		<button
			type="button"
			className={cn(
				"flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent hover:border-accent-foreground/20",
				className,
			)}
			{...props}
		>
			<span className="font-medium text-sm text-foreground">{title}</span>
			<span className="text-xs text-muted-foreground">{description}</span>
		</button>
	);
};
