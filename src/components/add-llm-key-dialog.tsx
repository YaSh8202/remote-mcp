import { ProviderLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { useModels } from "@/hooks/use-models";
import { useTRPC } from "@/integrations/trpc/react";
import { LLMProvider } from "@/types/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Key, Loader2, Shield } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";

const formSchema = z.object({
	provider: z.nativeEnum(LLMProvider),
	apiKey: z
		.string()
		.min(1, "API key is required")
		.min(10, "API key seems too short"),
});

type FormData = z.infer<typeof formSchema>;

// API key URLs for each provider
const providerApiKeyUrls: Partial<
	Record<LLMProvider, { url: string; label: string }>
> = {
	[LLMProvider.OPENAI]: {
		url: "https://platform.openai.com/api-keys",
		label: "OpenAI Platform",
	},
	[LLMProvider.ANTHROPIC]: {
		url: "https://console.anthropic.com/settings/keys",
		label: "Anthropic Console",
	},
	[LLMProvider.GOOGLE]: {
		url: "https://aistudio.google.com/apikey",
		label: "Google AI Studio",
	},
	[LLMProvider.ALIBABA]: {
		url: "https://www.alibabacloud.com/help/en/model-studio/developer-reference/get-api-key",
		label: "Alibaba Cloud",
	},
	[LLMProvider.GROQ]: {
		url: "https://console.groq.com/keys",
		label: "Groq Console",
	},
	[LLMProvider.GITHUB_MODELS]: {
		url: "https://github.com/settings/tokens",
		label: "GitHub Settings",
	},
	[LLMProvider.MISTRAL]: {
		url: "https://console.mistral.ai/api-keys",
		label: "Mistral Console",
	},
};

interface AddLLMKeyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingProviders: LLMProvider[];
	initialProvider?: LLMProvider;
}

export function AddLLMKeyDialog({
	open,
	onOpenChange,
	existingProviders,
	initialProvider,
}: AddLLMKeyDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { providers } = useModels();

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			provider: initialProvider || LLMProvider.OPENAI,
			apiKey: "",
		},
	});

	// Update form when initialProvider changes
	useEffect(() => {
		if (initialProvider && open) {
			form.setValue("provider", initialProvider);
		}
	}, [initialProvider, open, form]);

	const addKeyMutation = useMutation({
		mutationFn: trpc.llmProvider.addKey.mutationOptions().mutationFn,
		onSuccess: () => {
			toast.success("API key added and validated successfully!");
			form.reset();
			onOpenChange(false);
			queryClient.invalidateQueries({
				queryKey: trpc.llmProvider.getKeys.queryKey({}),
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to add API key: ${error.message}`);
		},
	});

	const onSubmit = (data: FormData) => {
		addKeyMutation.mutate({
			provider: data.provider,
			apiKey: data.apiKey,
		});
	};

	const getAvailableProviders = () => {
		return Object.values(LLMProvider).filter(
			(provider) => !existingProviders.includes(provider),
		);
	};

	const getProviderDisplayName = (provider: LLMProvider) => {
		return providers.find((p) => p.id === provider)?.name;
	};

	const renderSelectedProvider = (value: string) => {
		if (!value) return "Select a provider";
		return (
			<div className="flex items-center space-x-3">
				<ProviderLogo
					provider={value as LLMProvider}
					size={20}
					className="flex-shrink-0"
				/>
				<span className="font-medium">
					{getProviderDisplayName(value as LLMProvider)}
				</span>
			</div>
		);
	};

	const availableProviders = getAvailableProviders();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="space-y-3">
					<div className="flex items-center space-x-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<Key className="h-5 w-5 text-primary" />
						</div>
						<div>
							<DialogTitle className="text-left">Add API Key</DialogTitle>
							<DialogDescription className="text-left text-sm">
								Connect your LLM provider securely
							</DialogDescription>
						</div>
					</div>
					<div className="flex items-center space-x-2 rounded-lg bg-muted/50 p-3">
						<Shield className="h-4 w-4 text-green-600" />
						<p className="text-xs text-muted-foreground">
							Your API keys are encrypted and stored securely
						</p>
					</div>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="provider"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-medium">
										Provider
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger className="h-12">
												<div className="flex-1 text-left">
													{field.value
														? renderSelectedProvider(field.value)
														: "Select a provider"}
												</div>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{availableProviders.length === 0 ? (
												<div className="p-3 text-center text-sm text-muted-foreground">
													All providers have keys already
												</div>
											) : (
												availableProviders.map((provider) => {
													return (
														<SelectItem
															key={provider}
															value={provider}
															className="py-3"
														>
															<div className="flex items-center space-x-3">
																<ProviderLogo
																	provider={provider}
																	size={20}
																	className="flex-shrink-0"
																/>
																<span className="font-medium">
																	{getProviderDisplayName(provider)}
																</span>
															</div>
														</SelectItem>
													);
												})
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="apiKey"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-medium">API Key</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type="password"
												placeholder="sk-... or your provider's API key format"
												className="h-12 pl-4 pr-4"
												{...field}
												autoComplete="off"
											/>
										</div>
									</FormControl>
									<div className="space-y-2">
										{form.watch("provider") &&
											providerApiKeyUrls[form.watch("provider")] && (
												<div className="flex items-center space-x-2">
													<ExternalLink className="h-3 w-3 text-muted-foreground" />
													<a
														href={
															providerApiKeyUrls[form.watch("provider")]?.url
														}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-primary hover:text-primary/80 underline underline-offset-4"
													>
														Get your API key from{" "}
														{providerApiKeyUrls[form.watch("provider")]?.label}
													</a>
												</div>
											)}
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={addKeyMutation.isPending}
								className="h-11"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={
									addKeyMutation.isPending || availableProviders.length === 0
								}
								className="h-11"
							>
								{addKeyMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{addKeyMutation.isPending ? "Adding Key..." : "Add Key"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
