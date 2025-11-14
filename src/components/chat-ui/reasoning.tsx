"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type FC, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Markdown } from "./markdown";

type ReasoningStatus = "running" | "complete" | "incomplete";

interface ReasoningProps {
	text: string;
	status?: ReasoningStatus;
}

export const Reasoning: FC<ReasoningProps> = ({
	text,
	status = "complete",
}) => {
	const isRunning = status === "running";
	const isComplete = status === "complete";

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
		<div className="mb-4">
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
							"flex size-6 items-center justify-center rounded-md transition-colors",
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
						<div className="break-words">
							<Markdown>{text}</Markdown>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
