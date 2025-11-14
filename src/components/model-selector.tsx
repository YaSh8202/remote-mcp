import { useQuery } from "@tanstack/react-query";
import {
	Bot,
	Brain,
	Check,
	ChevronDown,
	Eye,
	Plus,
	Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import type { LLMProvider, ModelWithProvider } from "@/types/models";
import { LLMProvider as LLMProviderEnum } from "@/types/models";
import { AddLLMKeyDialog } from "./add-llm-key-dialog";
import { ProviderLogo } from "./icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ModelSelectorProps {
	selectedModel: string;
	onModelSelect: (model: string, provider: LLMProvider) => void;
	disabled?: boolean;
}

const ProviderIcon = ({
	provider,
}: {
	provider: LLMProvider;
}): React.ReactElement => {
	return <ProviderLogo provider={provider} size={16} />;
};

/**
 * Component to display model capabilities as icons
 */
const ModelCapabilities = ({ model }: { model: ModelWithProvider }) => {
	return (
		<div className="flex gap-1">
			{model.reasoning && (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex items-center justify-center w-5 h-5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
							<Brain className="h-3 w-3" />
						</div>
					</TooltipTrigger>
					<TooltipContent>Reasoning model</TooltipContent>
				</Tooltip>
			)}
			{model.attachment && (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex items-center justify-center w-5 h-5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
							<Eye className="h-3 w-3" />
						</div>
					</TooltipTrigger>
					<TooltipContent>Supports image/file uploads</TooltipContent>
				</Tooltip>
			)}
			{model.tool_call && (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex items-center justify-center w-5 h-5 rounded bg-green-500/10 text-green-600 dark:text-green-400">
							<Wrench className="h-3 w-3" />
						</div>
					</TooltipTrigger>
					<TooltipContent>Supports function calling</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
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

	const { providers } = useModels();

	const validKeys = keys.filter((key) => key.isValid === true);

	const availableProviders = useMemo(() => {
		if (!providers || validKeys.length === 0) return [];

		const providersWithKeys = validKeys.map((key) => key.provider);

		return providers.filter((provider) =>
			providersWithKeys.includes(provider.id),
		);
	}, [providers, validKeys]);

	const selectedModelInfo = useMemo(() => {
		for (const provider of availableProviders) {
			const model = provider.models.find((m) => m.fullId === selectedModel);
			if (model) return model;
		}
		return null;
	}, [availableProviders, selectedModel]);

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
						className="justify-between max-w-[300px]"
						disabled={disabled}
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
				<PopoverContent className="w-[400px] p-0" align="start">
					<Command>
						<CommandInput placeholder="Search models..." className="h-9" />
						<CommandList>
							<CommandEmpty>No models found.</CommandEmpty>
							<div className="max-h-[300px] overflow-auto">
								{availableProviders.map((provider) => (
									<CommandGroup
										key={provider.id}
										heading={
											<div className="flex items-center gap-2">
												<span>
													<ProviderIcon provider={provider.id} />
												</span>
												{provider.name}
											</div>
										}
									>
										{provider.models.map((model) => (
											<CommandItem
												key={model.fullId}
												value={`${model.name} ${model.id} ${model.fullId}`}
												onSelect={() => {
													onModelSelect(model.fullId, model.provider);
													setOpen(false);
												}}
												className="py-3"
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														selectedModel === model.fullId
															? "opacity-100"
															: "opacity-0",
													)}
												/>
												<div className="flex-1 space-y-1">
													<div className="flex items-center justify-between">
														<span className="font-medium text-sm">
															{model.name}
														</span>
														<ModelCapabilities model={model} />
													</div>
													<div className="flex items-center gap-2 text-xs text-muted-foreground">
														<span>
															Context: {(model.limit.context / 1000).toFixed(0)}
															k
														</span>
														<span>•</span>
														<span>
															${model.cost.input.toFixed(2)}/$
															{model.cost.output.toFixed(2)} per 1M tokens
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
