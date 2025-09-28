import {
	McpAppCategory,
	type McpAppMetadata,
} from "@/app/mcp/mcp-app/app-metadata";
import { useTRPC } from "@/integrations/trpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AppLogo } from "../AppLogo";
import { Badge } from "../ui/badge";

const categoryTitle = {
	[McpAppCategory.DEVELOPER_TOOLS]: "Developer Tools",
	[McpAppCategory.PRODUCTIVITY]: "Communication & Productivity",
	[McpAppCategory.COMMUNICATION]: "Communication & Productivity",
	[McpAppCategory.ENTERTAINMENT]: "Content & Media",
	[McpAppCategory.DATA_STORAGE]: "Data & Search",
	[McpAppCategory.SEARCH]: "Data & Search",
};

const categorizeApps = (apps: McpAppMetadata[]) => {
	const categories: { [key: string]: McpAppMetadata[] } = {
		...Object.values(categoryTitle).reduce(
			(acc, title) => {
				acc[title] = [];
				return acc;
			},
			{} as { [key: string]: McpAppMetadata[] },
		),
	};

	for (const app of apps) {
		const category = app.categories[0] || "Utilities";
		const categoryTitleStr = categoryTitle[category] || "Utilities";
		if (categories[categoryTitleStr]) {
			categories[categoryTitleStr].push(app);
		}
	}

	return categories;
};

export function AvailableAppsSection() {
	const [active, setActive] = useState<McpAppMetadata | null>(null);
	const ref = useRef<HTMLDivElement>(null);

	const trpc = useTRPC();
	const { data: apps } = useSuspenseQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setActive(null);
			}
		}

		if (active) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [active]);

	// Handle outside clicks to close the modal
	useEffect(() => {
		if (!active || !ref.current) return;

		const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setActive(null);
			}
		};

		document.addEventListener("mousedown", handleOutsideClick);
		document.addEventListener("touchstart", handleOutsideClick);

		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
			document.removeEventListener("touchstart", handleOutsideClick);
		};
	}, [active]);

	// Group apps by category (based on name patterns)

	const appCategories = apps ? categorizeApps(apps) : {};
	const totalApps = apps?.length || 0;
	const totalTools =
		apps?.reduce(
			(sum: number, app: McpAppMetadata) => sum + (app.tools?.length || 0),
			0,
		) || 0;

	return (
		<>
			<AnimatePresence>
				{active && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/20 h-full w-full z-10"
					/>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{active && (
					<div className="fixed inset-0 grid place-items-center z-[100]">
						<motion.div
							ref={ref}
							layoutId={`card-${active.name}`}
							className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
						>
							<motion.div layoutId={`image-${active.name}`} className="p-6">
								<div className="flex items-center space-x-4">
									<AppLogo
										logo={active.logo}
										appName={active.name}
										className="size-10"
									/>
									<div>
										<motion.h3
											layoutId={`title-${active.name}`}
											className="font-bold text-neutral-700 dark:text-neutral-200 text-xl"
										>
											{active.displayName || active.name}
										</motion.h3>
										<motion.p
											layoutId={`description-${active.name}`}
											className="text-neutral-600 dark:text-neutral-400"
										>
											{active.tools?.length || 0} tools available
										</motion.p>
									</div>
								</div>
							</motion.div>
							<div className="pt-4 relative px-6 pb-6">
								<motion.div
									layout
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="text-neutral-600 text-sm md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400"
								>
									<p>{active.description}</p>
								</motion.div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			<section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
							{totalTools}+ Tools Across {totalApps} Apps
						</h2>
						<p className="text-xl text-gray-400 max-w-3xl mx-auto">
							Connect your AI agents to the most popular tools and services used
							by millions of developers and teams worldwide.
						</p>
					</motion.div>

					<div className="space-y-12">
						{Object.entries(appCategories).map(
							([categoryTitle, categoryApps], categoryIndex) => {
								if (categoryApps.length === 0) return null;

								return (
									<motion.div
										key={categoryTitle}
										initial={{ opacity: 0, y: 40 }}
										whileInView={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
										viewport={{ once: true }}
										className="space-y-6"
									>
										<h3 className="text-2xl font-semibold text-white">
											{categoryTitle}
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
											{categoryApps.map((app, appIndex) => (
												<motion.div
													key={app.name}
													layoutId={`card-${app.name}`}
													initial={{ opacity: 0, scale: 0.9 }}
													whileInView={{ opacity: 1, scale: 1 }}
													transition={{
														duration: 0.5,
														delay: categoryIndex * 0.1 + appIndex * 0.05,
													}}
													viewport={{ once: true }}
													whileHover={{ scale: 1.05 }}
													onClick={() => setActive(app)}
													className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all duration-300 cursor-pointer group relative"
												>
													<div className="flex items-center space-x-4 mb-4 relative z-10">
														<AppLogo
															logo={app.logo}
															appName={app.name}
															className="size-8"
														/>
														<div>
															<motion.h4
																layoutId={`title-${app.name}`}
																className="text-lg font-semibold text-white group-hover:text-gray-200"
															>
																{app.displayName || app.name}
															</motion.h4>
															<motion.div layoutId={`description-${app.name}`}>
																<Badge
																	variant="secondary"
																	className="bg-neutral-800 text-gray-300"
																>
																	{app.tools?.length || 0} tools
																</Badge>
															</motion.div>
														</div>
													</div>
													<p className="text-gray-400 text-sm relative z-10 line-clamp-3">
														{app.description ||
															`Comprehensive ${app.name.toLowerCase()} integration with ${app.tools?.length || 0} available tools and operations.`}
													</p>
												</motion.div>
											))}
										</div>
									</motion.div>
								);
							},
						)}
					</div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.5 }}
						viewport={{ once: true }}
						className="text-center mt-16"
					>
						<p className="text-gray-500 text-lg">
							New apps and tools are being added regularly!
							<span className="text-white font-semibold">
								{" "}
								Have a specific integration in mind?
							</span>{" "}
							Let us know!
						</p>
					</motion.div>
				</div>
			</section>
		</>
	);
}
