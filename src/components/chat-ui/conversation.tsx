"use client";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useChatContext } from "@/contexts/chat-context";
import { cn } from "@/lib/utils";
import { ArrowDownIcon } from "lucide-react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { AssistantMessage, UserMessage } from "./message";

interface ConversationProps {
	children?: ReactNode;
	className?: string;
	emptyState?: ReactNode;
}

export function Conversation({
	children,
	className,
	emptyState,
}: ConversationProps) {
	const { messages, reload } = useChatContext();
	const viewportRef = useRef<HTMLDivElement>(null);
	const [showScrollButton, setShowScrollButton] = useState(false);

	// Auto-scroll to bottom on new messages
	// biome-ignore lint/correctness/useExhaustiveDependencies: Want to trigger on messages array changes
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const isNearBottom =
			viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;

		if (isNearBottom) {
			viewport.scrollTo({
				top: viewport.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [messages]);

	// Handle scroll to check if we should show scroll button
	const handleScroll = () => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const isNearBottom =
			viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
		setShowScrollButton(!isNearBottom);
	};

	const scrollToBottom = () => {
		viewportRef.current?.scrollTo({
			top: viewportRef.current.scrollHeight,
			behavior: "smooth",
		});
	};

	return (
		<LazyMotion features={domAnimation}>
			<MotionConfig reducedMotion="user">
				<div
					className={cn(
						"flex h-full flex-col bg-background @container border-border outline-ring/50",
						className,
					)}
					style={{
						["--thread-max-width" as string]: "44rem",
					}}
				>
					<div
						ref={viewportRef}
						onScroll={handleScroll}
						className="relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll px-4"
					>
						{/* Empty state */}
						{messages.length === 0 && emptyState}

						{/* Messages */}
						{messages.map((message, index) => {
							const isLast = index === messages.length - 1;

							if (message.role === "user") {
								return <UserMessage key={message.id} message={message} />;
							}

							if (message.role === "assistant") {
								return (
									<AssistantMessage
										key={message.id}
										message={message}
										onReload={isLast ? reload : undefined}
										isLast={isLast}
									/>
								);
							}

							return null;
						})}

						<div className="min-h-8 grow" />

						{/* Scroll to bottom button */}
						{showScrollButton && (
							<TooltipIconButton
								tooltip="Scroll to bottom"
								variant="outline"
								className="absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
								onClick={scrollToBottom}
							>
								<ArrowDownIcon />
							</TooltipIconButton>
						)}

						{/* Children content */}
						{children}
					</div>
				</div>
			</MotionConfig>
		</LazyMotion>
	);
}

interface WelcomeScreenProps {
	title?: string;
	subtitle?: string;
	suggestions?: Array<{
		title: string;
		label: string;
		action: string;
	}>;
}

export function WelcomeScreen({
	title = "Hello there!",
	subtitle = "How can I help you today?",
	suggestions,
}: WelcomeScreenProps) {
	const { setInput, handleSubmit } = useChatContext();

	const handleSuggestionClick = (action: string) => {
		setInput(action);
		// Trigger submit
		setTimeout(() => {
			const form = document.querySelector("form");
			if (form) {
				const event = new Event("submit", {
					bubbles: true,
					cancelable: true,
				});
				form.dispatchEvent(event);
			}
		}, 0);
	};

	return (
		<div className="mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
			<div className="flex w-full flex-grow flex-col items-center justify-center">
				<div className="flex size-full flex-col justify-center px-8">
					<m.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						className="text-2xl font-semibold"
					>
						{title}
					</m.div>
					<m.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						transition={{ delay: 0.1 }}
						className="text-2xl text-muted-foreground/65"
					>
						{subtitle}
					</m.div>
				</div>

				{/* Suggestions */}
				{suggestions && suggestions.length > 0 && (
					<div className="grid w-full gap-2 px-8 mt-8 @md:grid-cols-2">
						{suggestions.map((suggestion, index) => (
							<m.button
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={{ delay: 0.05 * index }}
								onClick={() => handleSuggestionClick(suggestion.action)}
								className="h-auto w-full flex-1 flex-wrap items-start justify-start gap-1 rounded-3xl border px-5 py-4 text-left text-sm hover:bg-accent/60 @md:flex-col"
							>
								<span className="font-medium">{suggestion.title}</span>
								<span className="text-muted-foreground">
									{suggestion.label}
								</span>
							</m.button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
