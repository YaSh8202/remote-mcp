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
	SelectValue,
} from "@/components/ui/select";
import { useModels } from "@/hooks/use-models";
import { useTRPC } from "@/integrations/trpc/react";
import { LLMProvider } from "@/types/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	provider: z.nativeEnum(LLMProvider),
	apiKey: z
		.string()
		.min(1, "API key is required")
		.min(10, "API key seems too short"),
});

type FormData = z.infer<typeof formSchema>;

interface AddLLMKeyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingProviders: LLMProvider[];
}

export function AddLLMKeyDialog({
	open,
	onOpenChange,
	existingProviders,
}: AddLLMKeyDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { providers } = useModels();

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			provider: LLMProvider.OPENAI,
			apiKey: "",
		},
	});

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
		return providers.find((p) => p.id === provider)?.displayName;
	};

	const availableProviders = getAvailableProviders();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add API Key</DialogTitle>
					<DialogDescription>
						Add a new API key for your LLM provider. Keys are encrypted and
						stored securely.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="provider"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Provider</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a provider" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{availableProviders.length === 0 ? (
												<div className="p-2 text-sm text-muted-foreground">
													All providers have keys already
												</div>
											) : (
												availableProviders.map((provider) => (
													<SelectItem key={provider} value={provider}>
														{getProviderDisplayName(provider)}
													</SelectItem>
												))
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
									<FormLabel>API Key</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Enter your API key"
											{...field}
											autoComplete="off"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={addKeyMutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={
									addKeyMutation.isPending || availableProviders.length === 0
								}
							>
								{addKeyMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Add Key
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
