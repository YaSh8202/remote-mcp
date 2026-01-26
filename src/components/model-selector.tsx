import { useQuery } from "@tanstack/react-query";
import { Bot, Brain, ChevronDown, Eye, Plus, Wrench } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useModels } from "@/hooks/use-models";
import { useTRPC } from "@/integrations/trpc/react";
import { cn } from "@/lib/utils";
import { useChatModel, useChatStore } from "@/store/chat-store";
import type { LLMProvider, ModelWithProvider } from "@/types/models";
import { LLMProvider as LLMProviderEnum } from "@/types/models";
import { AddLLMKeyDialog } from "./add-llm-key-dialog";
import { ProviderLogo } from "./icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ModelSelectorProps {
	disabled?: boolean;
}

const ProviderIcon = ({
	provider,
	size = 16,
}: {
	provider: LLMProvider;
	size?: number;
}): React.ReactElement => {
	return <ProviderLogo provider={provider} size={size} />;
};

/**
 * Component to display model capabilities as icons
 */
const ModelCapabilities = ({ model }: { model: ModelWithProvider }) => {
	return (
		<div className="flex items-center gap-0.5 bg-muted-foreground/8 p-0.75 rounded-full">
			{model.attachment && (
				<Tooltip>
					<TooltipTrigger asChild>
						<div
							className="relative flex size-5 items-center justify-center overflow-hidden text-[color:var(--color)] dark:text-[color:var(--color-dark)]"
							style={
								{
									"--color-dark": "hsl(168 54% 74%)",
									"--color": "hsl(168 54% 52%)",
								} as React.CSSProperties
							}
						>
							<Eye className="size-3.5 text-inherit" />
						</div>
					</TooltipTrigger>
					<TooltipContent>Vision</TooltipContent>
				</Tooltip>
			)}
			{model.reasoning && (
				<Tooltip>
					<TooltipTrigger asChild>
						<div
							className="relative flex size-5 items-center justify-center overflow-hidden text-[color:var(--color)] dark:text-[color:var(--color-dark)]"
							style={
								{
									"--color-dark": "hsl(263 58% 75%)",
									"--color": "hsl(263 58% 53%)",
								} as React.CSSProperties
							}
						>
							<Brain className="size-3.5 text-inherit" />
						</div>
					</TooltipTrigger>
					<TooltipContent>Reasoning</TooltipContent>
				</Tooltip>
			)}
			{model.tool_call && (
				<Tooltip>
					<TooltipTrigger asChild>
						<div
							className="relative flex size-5 items-center justify-center overflow-hidden text-[color:var(--color)] dark:text-[color:var(--color-dark)]"
							style={
								{
									"--color-dark": "hsl(237 75% 77%)",
									"--color": "hsl(237 55% 57%)",
								} as React.CSSProperties
							}
						>
							<Wrench className="size-3.5 text-inherit" />
						</div>
					</TooltipTrigger>
					<TooltipContent>Tool Calling</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
};

const transition = {
	type: "tween" as const,
	ease: "easeOut" as const,
	duration: 0.15,
};

/**
 * Provider sidebar component - vertical strip of provider icons with animation
 */
const ProviderSidebar = ({
	providers,
	activeProvider,
	onProviderSelect,
	onAddKey,
	canAddMoreKeys,
}: {
	providers: { id: LLMProvider; name: string }[];
	activeProvider: LLMProvider | null;
	onProviderSelect: (provider: LLMProvider) => void;
	onAddKey: () => void;
	canAddMoreKeys: boolean;
}) => {
	const [buttonRefs, setButtonRefs] = useState<Array<HTMLButtonElement | null>>(
		[],
	);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const navRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setButtonRefs((prev) => prev.slice(0, providers.length));
	}, [providers.length]);

	const navRect = navRef.current?.getBoundingClientRect();
	const activeIndex = providers.findIndex((p) => p.id === activeProvider);
	const activeRect = buttonRefs[activeIndex]?.getBoundingClientRect();
	const hoveredRect = buttonRefs[hoveredIndex ?? -1]?.getBoundingClientRect();

	return (
		<div className="flex flex-col w-[52px] border-r bg-muted/30">
			<div className="flex-1 overflow-y-auto">
				<nav
					ref={navRef}
					className="relative flex flex-col items-center gap-1.5 p-2"
					onPointerLeave={() => setHoveredIndex(null)}
				>
					{providers.map((provider, i) => (
						<Tooltip key={provider.id}>
							<TooltipTrigger asChild>
								<button
									ref={(el) => {
										buttonRefs[i] = el;
									}}
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onProviderSelect(provider.id);
									}}
									onPointerEnter={() => setHoveredIndex(i)}
									onFocus={() => setHoveredIndex(i)}
									className={cn(
										"relative z-20 flex items-center justify-center w-9 h-9 rounded-md transition-colors cursor-pointer",
										activeProvider === provider.id
											? "text-primary"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<ProviderIcon provider={provider.id} size={20} />
								</button>
							</TooltipTrigger>
							<TooltipContent side="left">{provider.name}</TooltipContent>
						</Tooltip>
					))}

					{/* Hover effect */}
					<AnimatePresence>
						{hoveredRect && navRect && hoveredIndex !== activeIndex && (
							<motion.div
								key="hover"
								className="absolute top-0 left-0 z-10 rounded-md bg-muted"
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

					{/* Active indicator */}
					<AnimatePresence>
						{activeRect && navRect && (
							<motion.div
								className="absolute top-0 left-0 z-10 rounded-md bg-primary/10 ring-1 ring-primary/20"
								initial={false}
								animate={{
									width: activeRect.width,
									height: activeRect.height,
									x: activeRect.left - navRect.left,
									y: activeRect.top - navRect.top,
									opacity: 1,
								}}
								transition={transition}
							/>
						)}
					</AnimatePresence>
				</nav>
			</div>
			{canAddMoreKeys && (
				<div className="border-t p-2 flex justify-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onAddKey();
								}}
								className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
							>
								<Plus className="h-4 w-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="right">Add API key</TooltipContent>
					</Tooltip>
				</div>
			)}
		</div>
	);
};
export function ModelSelector({ disabled }: ModelSelectorProps) {
	const [open, setOpen] = useState(false);
	const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false);
	const [activeProviderTab, setActiveProviderTab] =
		useState<LLMProvider | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const trpc = useTRPC();
	const { setSelectedModel: onModelSelect } = useChatStore();

	const { data: keys = [] } = useQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);

	const { providers } = useModels();

	const validKeys = keys.filter((key) => key.isValid === true);

	const availableProviders = useMemo(() => {
		if (!providers || validKeys.length === 0) return [];

		const providersWithKeys = validKeys.map((key) => key.provider);

		return providers.filter((provider) =>
			providersWithKeys.includes(provider.id),
		);
	}, [providers, validKeys]);

	const selectedModelInfo = useChatModel();

	// Calculate providers that don't have valid keys
	const existingProviders = validKeys.map((key) => key.provider as LLMProvider);
	const missingProviders = Object.values(LLMProviderEnum).filter(
		(provider) => !existingProviders.includes(provider),
	);
	const canAddMoreKeys = missingProviders.length > 0;

	// Check if we're in search mode (searching across all providers)
	const isSearchMode = searchQuery.trim().length > 0;

	// Filter models by selected provider OR search across all providers
	const filteredModels = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();

		// If searching, search across all providers
		if (query) {
			return availableProviders.flatMap((provider) =>
				provider.models.filter(
					(model) =>
						model.name.toLowerCase().includes(query) ||
						model.id.toLowerCase().includes(query),
				),
			);
		}

		// Otherwise, show models from selected provider only
		const activeProvider = availableProviders.find(
			(p) => p.id === activeProviderTab,
		);
		return activeProvider?.models ?? [];
	}, [availableProviders, activeProviderTab, searchQuery]);

	// Track previous open state to detect when popover opens
	const prevOpenRef = useRef(false);

	// Sync provider tab only when popover first opens (not on every re-render)
	useEffect(() => {
		const wasOpen = prevOpenRef.current;
		prevOpenRef.current = open;

		// Only initialize when transitioning from closed to open
		if (open && !wasOpen) {
			if (
				selectedModelInfo &&
				availableProviders.some((p) => p.id === selectedModelInfo.provider)
			) {
				setActiveProviderTab(selectedModelInfo.provider);
			} else if (availableProviders.length > 0) {
				setActiveProviderTab(availableProviders[0].id);
			}
		}

		// Clear search when closing
		if (!open && wasOpen) {
			setSearchQuery("");
		}
	}, [open, selectedModelInfo, availableProviders]);

	const handleModelSelect = (model: ModelWithProvider) => {
		onModelSelect(model.id, model.provider);
		setOpen(false);
	};

	const handleAddKey = () => {
		setIsAddKeyDialogOpen(true);
		setOpen(false);
	};

	if (validKeys.length === 0) {
		return (
			<>
				<div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border-destructive/50">
					<Bot className="h-4 w-4 text-destructive" />
					<span className="text-sm text-destructive flex-1">
						No API keys configured
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsAddKeyDialogOpen(true)}
						className="h-6 px-2 text-xs"
					>
						<Plus className="h-3 w-3 mr-1" />
						Add Key
					</Button>
				</div>

				<AddLLMKeyDialog
					open={isAddKeyDialogOpen}
					onOpenChange={setIsAddKeyDialogOpen}
					existingProviders={[]}
				/>
			</>
		);
	}

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						aria-expanded={open}
						className="justify-between max-w-[300px]"
						disabled={disabled}
						size={"sm"}
					>
						<div className="flex items-center gap-2 truncate">
							{selectedModelInfo && (
								<span className="text-sm">
									<ProviderIcon provider={selectedModelInfo.provider} />
								</span>
							)}
							<span className="truncate">
								{selectedModelInfo ? selectedModelInfo.name : "Select model"}
							</span>
						</div>
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[420px] h-[380px] p-0" align="start">
					<Command shouldFilter={false} className="flex flex-col h-full">
						{/* Search Input - Full Width at Top */}
						<CommandInput
							placeholder="Search models..."
							value={searchQuery}
							onValueChange={setSearchQuery}
							className="h-9"
						/>

						{/* Provider Sidebar + Model List */}
						<div className="flex flex-1 min-h-0">
							{/* Provider Sidebar - hidden when searching */}
							{!isSearchMode && (
								<ProviderSidebar
									providers={availableProviders}
									activeProvider={activeProviderTab}
									onProviderSelect={setActiveProviderTab}
									onAddKey={handleAddKey}
									canAddMoreKeys={canAddMoreKeys}
								/>
							)}

							{/* Model List */}
							<CommandList className="flex-1 px-2 py-2 max-h-none overflow-y-auto">
								{filteredModels.length === 0 ? (
									<CommandEmpty>
										{searchQuery
											? "No models match your search"
											: "No models available"}
									</CommandEmpty>
								) : (
									filteredModels.map((model) => (
										<CommandItem
											key={model.fullId}
											value={`${model.name} ${model.id} ${model.fullId}`}
											onSelect={() => handleModelSelect(model)}
											className={cn(
												"py-2 px-3",
												selectedModelInfo?.fullId === model.fullId &&
													"bg-primary/10 text-primary",
											)}
										>
											{/* Show provider icon when searching across all providers */}
											{isSearchMode && (
												<div className="mr-2 flex-shrink-0">
													<ProviderIcon provider={model.provider} size={18} />
												</div>
											)}
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<span className="font-medium text-sm truncate">
														{model.name}
													</span>
													<ModelCapabilities model={model} />
												</div>
												<div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
													{model.limit?.context && (
														<span>
															Context:&nbsp;
															{new Intl.NumberFormat("en-US", {
																notation: "compact",
															}).format(model.limit.context)}{" "}
														</span>
													)}
													{!!model.cost?.input && !!model.cost?.output && (
														<>
															<span>•</span>
															<span>
																${model.cost.input.toFixed(2)}/$
																{model.cost.output.toFixed(2)} per 1M
															</span>
														</>
													)}
												</div>
											</div>
										</CommandItem>
									))
								)}
							</CommandList>
						</div>
					</Command>
				</PopoverContent>
			</Popover>

			<AddLLMKeyDialog
				open={isAddKeyDialogOpen}
				onOpenChange={setIsAddKeyDialogOpen}
				existingProviders={existingProviders}
			/>
		</>
	);
}
