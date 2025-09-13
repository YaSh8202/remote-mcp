import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
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
import type { LLMProvider } from "@/types/models";
import { LLMProvider as LLMProviderEnum } from "@/types/models";
import { useQuery } from "@tanstack/react-query";
import { Bot, Check, ChevronDown, Plus } from "lucide-react";
import { Eye as Vision } from "lucide-react";
import { useMemo, useState } from "react";
import { AddLLMKeyDialog } from "./add-llm-key-dialog";
import { llmProviderIcons } from "./icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ModelSelectorProps {
	selectedModel: string;
	onModelSelect: (model: string, provider: LLMProvider) => void;
	disabled?: boolean;
}

const ProviderIcon = ({
	provider,
}: { provider: LLMProvider }): React.ReactElement => {
	const Icon = llmProviderIcons[provider];
	return <Icon />;
};

export function ModelSelector({
	selectedModel,
	onModelSelect,
	disabled,
}: ModelSelectorProps) {
	const [open, setOpen] = useState(false);
	const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false);
	const trpc = useTRPC();

	const { data: keys = [] } = useQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);

	const { models, providers } = useModels();

	const validKeys = keys.filter((key) => key.isValid === true);

	const availableModels = useMemo(() => {
		if (!models || validKeys.length === 0) return [];

		const providersWithKeys = validKeys.map((key) => key.provider);

		return models.filter((model) =>
			providersWithKeys.includes(model.meta.provider),
		);
	}, [models, validKeys]);

	const selectedModelInfo = availableModels.find(
		(model) => model.meta.id === selectedModel,
	);

	const getProviderDisplayName = (provider: LLMProvider) => {
		return providers.find((p) => p.id === provider)?.displayName ?? "";
	};

	const groupedModels = useMemo(() => {
		// Initialize with all enum values
		const groups: Partial<Record<LLMProvider, typeof availableModels>> = {};
		for (const model of availableModels) {
			const provider = model.meta.provider;
			if (!groups[provider]) {
				groups[provider] = [];
			}
			groups[provider]?.push(model);
		}
		return groups;
	}, [availableModels]);

	// Calculate providers that don't have valid keys
	const existingProviders = validKeys.map((key) => key.provider as LLMProvider);
	const missingProviders = Object.values(LLMProviderEnum).filter(
		(provider) => !existingProviders.includes(provider),
	);
	const canAddMoreKeys = missingProviders.length > 0;

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
						className="justify-between  max-w-[300px]"
						disabled={disabled}
					>
						<div className="flex items-center gap-2 truncate">
							{selectedModelInfo && (
								<span className="text-sm">
									<ProviderIcon provider={selectedModelInfo.meta.provider} />
								</span>
							)}
							<span className="truncate">
								{selectedModelInfo
									? selectedModelInfo.meta.displayName
									: "Select model"}
							</span>
						</div>
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[400px] p-0" align="start">
					<Command>
						<CommandInput placeholder="Search models..." className="h-9" />
						<CommandList>
							<CommandEmpty>No models found.</CommandEmpty>
							<div className="max-h-[300px] overflow-auto">
								{Object.entries(groupedModels).map(([provider, models]) => (
									<CommandGroup
										key={provider}
										heading={
											<div className="flex items-center gap-2">
												<span>
													<ProviderIcon provider={provider as LLMProvider} />
												</span>
												{getProviderDisplayName(provider as LLMProvider)}
											</div>
										}
									>
										{models.map((model) => (
											<CommandItem
												key={model.meta.id}
												value={`${model.meta.displayName} ${model.meta.id} ${model.meta.name} ${model.meta.family || ""}`}
												onSelect={() => {
													onModelSelect(model.meta.id, model.meta.provider);
													setOpen(false);
												}}
												className="py-3"
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														selectedModel === model.meta.id
															? "opacity-100"
															: "opacity-0",
													)}
												/>
												<div className="flex-1 space-y-1">
													<div className="flex items-center justify-between">
														<span className="font-medium text-sm">
															{model.meta.displayName.split(":")[1]}
														</span>
														<div className="flex gap-1">
															{model.meta.tags.slice(0, 2).map((tag, index) => (
																<Badge
																	key={index}
																	variant="secondary"
																	className="text-xs h-5 px-1.5"
																>
																	{tag === "vision" ? (
																		<Tooltip>
																			<TooltipTrigger>
																				<Vision className="h-3 w-3" />
																			</TooltipTrigger>
																			<TooltipContent>
																				Supports image uploads and analysis
																			</TooltipContent>
																		</Tooltip>
																	) : (
																		tag
																	)}
																</Badge>
															))}
														</div>
													</div>
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<span>
															Context:{" "}
															{(model.limits.contextWindow / 1000).toFixed(0)}k
														</span>
														<span>•</span>
														<span>
															${model.pricing.inputPerMTokUSD.toFixed(2)}/ $
															{model.pricing.outputPerMTokUSD.toFixed(2)} per 1M
															tokens
														</span>
													</div>
												</div>
											</CommandItem>
										))}
									</CommandGroup>
								))}
							</div>
							{canAddMoreKeys && (
								<div className="border-t p-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setIsAddKeyDialogOpen(true);
											setOpen(false);
										}}
										className="w-full justify-start text-muted-foreground hover:text-foreground"
									>
										<Plus className="h-4 w-4 mr-2" />
										Add API key for more providers ({missingProviders.length}{" "}
										available)
									</Button>
								</div>
							)}
						</CommandList>
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
