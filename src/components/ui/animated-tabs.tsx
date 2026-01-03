"use client";

import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { type Tab, useAnimatedTabs } from "@/hooks/use-animated-tabs";
import { cn } from "@/lib/utils";

interface AnimatedTabsProps {
	tabs: Tab[];
	defaultValue?: string;
	children: React.ReactNode;
	className?: string;
}

const transition = {
	type: "tween" as const,
	ease: "easeOut" as const,
	duration: 0.15,
};

const AnimatedTabsList = ({
	tabs,
	selectedTabIndex,
	setSelectedTab,
}: {
	tabs: Tab[];
	selectedTabIndex: number;
	setSelectedTab: (input: [number, number]) => void;
}): React.ReactElement => {
	const [buttonRefs, setButtonRefs] = React.useState<
		Array<HTMLButtonElement | null>
	>([]);

	React.useEffect(() => {
		setButtonRefs((prev) => prev.slice(0, tabs.length));
	}, [tabs.length]);

	const navRef = React.useRef<HTMLDivElement>(null);
	const navRect = navRef.current?.getBoundingClientRect();

	const selectedRect = buttonRefs[selectedTabIndex]?.getBoundingClientRect();

	const [hoveredTabIndex, setHoveredTabIndex] = React.useState<number | null>(
		null,
	);
	const hoveredRect =
		buttonRefs[hoveredTabIndex ?? -1]?.getBoundingClientRect();

	return (
		<nav
			ref={navRef}
			className="flex flex-wrap justify-start items-center relative z-0 gap-1"
			onPointerLeave={() => setHoveredTabIndex(null)}
		>
			{tabs.map((item, i) => {
				const isActive = selectedTabIndex === i;

				return (
					<motion.button
						key={item.value}
						ref={(el) => {
							buttonRefs[i] = el;
						}}
						type="button"
						className={cn(
							"text-sm relative flex items-center gap-2 px-3 py-2 z-20 bg-transparent cursor-pointer select-none transition-colors rounded-md min-w-fit whitespace-nowrap",
							{
								"text-muted-foreground hover:text-foreground": !isActive,
								"text-foreground": isActive,
							},
						)}
						onPointerEnter={() => setHoveredTabIndex(i)}
						onFocus={() => setHoveredTabIndex(i)}
						onClick={() => setSelectedTab([i, i > selectedTabIndex ? 1 : -1])}
					>
						{item.icon}
						<span>{item.label}</span>
					</motion.button>
				);
			})}

			{/* Hover effect */}
			<AnimatePresence>
				{hoveredRect && navRect && hoveredTabIndex !== selectedTabIndex && (
					<motion.div
						key="hover"
						className="absolute z-10 rounded-md bg-muted/50"
						initial={{ opacity: 0 }}
						animate={{
							opacity: 1,
							width: hoveredRect.width,
							height: hoveredRect.height,
							x: hoveredRect.left - navRect.left,
							y: hoveredRect.top - navRect.top,
						}}
						exit={{ opacity: 0 }}
						transition={transition}
					/>
				)}
			</AnimatePresence>

			{/* Active tab underline */}
			<AnimatePresence>
				{selectedRect && navRect && (
					<motion.div
						className="absolute bottom-0 left-0 h-0.5 bg-foreground rounded-full"
						initial={false}
						animate={{
							width: selectedRect.width,
							x: selectedRect.left - navRect.left,
							opacity: 1,
						}}
						transition={transition}
					/>
				)}
			</AnimatePresence>
		</nav>
	);
};

interface AnimatedTabsContentProps {
	value: string;
	children: React.ReactNode;
	className?: string;
}

const AnimatedTabsContent = ({
	value,
	children,
	className,
}: AnimatedTabsContentProps) => {
	return (
		<motion.div
			key={value}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={transition}
			className={cn("mt-4", className)}
		>
			{children}
		</motion.div>
	);
};

export function AnimatedTabs({
	tabs,
	defaultValue,
	children,
	className,
}: AnimatedTabsProps) {
	const [hookProps] = React.useState(() => {
		const initialTabId = defaultValue || tabs[0]?.value;

		return {
			tabs: tabs.map(({ label, value, icon }) => ({
				label,
				value,
				icon,
			})),
			initialTabId,
		};
	});

	const framer = useAnimatedTabs(hookProps);

	return (
		<div className={cn("w-full", className)}>
			<AnimatedTabsList {...framer.tabProps} />
			<AnimatePresence mode="wait">
				{React.Children.map(children, (child) => {
					if (
						React.isValidElement<AnimatedTabsContentProps>(child) &&
						child.props.value === framer.selectedTab.value
					) {
						return (
							<AnimatedTabsContent
								value={child.props.value}
								className={child.props.className}
							>
								{child.props.children}
							</AnimatedTabsContent>
						);
					}
					return null;
				})}
			</AnimatePresence>
		</div>
	);
}

export { AnimatedTabsContent };
