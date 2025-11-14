"use client";

import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type FC, useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

// Match assistant-ui's reasoning status types
type ReasoningStatus =
	| { readonly type: "running" }
	| { readonly type: "complete" }
	| {
			readonly type: "incomplete";
			readonly reason:
				| "length"
				| "error"
				| "other"
				| "cancelled"
				| "content-filter";
			readonly error?: unknown;
	  }
	| {
			readonly type: "requires-action";
			readonly reason: "tool-calls" | "interrupt";
	  };

interface ReasoningTextProps {
	status: ReasoningStatus;
	text: string;
	type: "reasoning";
}

export const ReasoningText: FC<ReasoningTextProps> = ({
	status,
	text = "",
}) => {
	const isRunning = status.type === "running";
	const isComplete = status.type === "complete";

	// Auto-expand when running, auto-collapse when complete
	const [isExpanded, setIsExpanded] = useState(isRunning);

	// Update expansion state based on status changes
	useEffect(() => {
		if (isRunning) {
			setIsExpanded(true);
		} else if (isComplete) {
			// Auto-collapse after completion
			const timer = setTimeout(() => setIsExpanded(false), 300);
			return () => clearTimeout(timer);
		}
	}, [isRunning, isComplete]);

	const variants = {
		collapsed: {
			height: 0,
			opacity: 0,
			overflow: "hidden",
		},
		expanded: {
			height: "auto",
			opacity: 1,
			overflow: "hidden",
		},
	};

	// Don't render if there's no text and not running
	if (!text && !isRunning) {
		return null;
	}

	return (
		<div className="aui-reasoning-root mb-4">
			{/* Header with toggle button */}
			{(text || isRunning) && (
				<div className="mb-2 flex items-center gap-2">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						{isRunning && (
							<Loader2 className="size-3.5 animate-spin text-blue-500" />
						)}
						<span className="font-medium">
							{isRunning
								? "Thinking..."
								: isComplete
									? "Reasoned for a few seconds"
									: "Reasoning (incomplete)"}
						</span>
					</div>
					<Button
						variant="ghost"
						size={"icon"}
						className={cn(
							" flex size-6 items-center justify-center rounded-md transition-colors",
							"hover:bg-muted dark:hover:bg-muted/60",
							{
								"bg-muted dark:bg-muted/80": isExpanded,
							},
						)}
						onClick={() => setIsExpanded(!isExpanded)}
						aria-label={isExpanded ? "Collapse reasoning" : "Expand reasoning"}
					>
						{isExpanded ? (
							<ChevronDown className="size-4" />
						) : (
							<ChevronUp className="size-4" />
						)}
					</Button>
				</div>
			)}

			{/* Collapsible content */}
			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						key="reasoning-content"
						className="flex flex-col gap-4 border-l-2 border-muted-foreground/20 pl-3 text-sm text-muted-foreground dark:border-muted-foreground/30"
						initial="collapsed"
						animate="expanded"
						exit="collapsed"
						variants={variants}
						transition={{ duration: 0.2, ease: "easeInOut" }}
					>
						<div className="aui-reasoning-content break-words prose prose-sm dark:prose-invert max-w-none">
							<Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
