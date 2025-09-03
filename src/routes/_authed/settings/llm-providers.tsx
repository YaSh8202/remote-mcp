import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon, KeyIcon, TrashIcon, EditIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
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
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/integrations/trpc/react";
import { LLMProviderType } from "@/db/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const providerFormSchema = z.object({
	providerType: z.nativeEnum(LLMProviderType),
	displayName: z.string().min(1, "Display name is required"),
	apiKey: z.string().min(1, "API key is required"),
});

type ProviderFormData = z.infer<typeof providerFormSchema>;

export const Route = createFileRoute("/_authed/settings/llm-providers")({
	component: LLMProvidersPage,
});

const providerTypeLabels = {
	[LLMProviderType.OPENAI]: "OpenAI",
	[LLMProviderType.CLAUDE]: "Anthropic Claude",
	[LLMProviderType.OPENROUTER]: "OpenRouter",
	[LLMProviderType.GEMINI]: "Google Gemini",
};

const providerDescriptions = {
	[LLMProviderType.OPENAI]: "GPT-4, GPT-3.5, and other OpenAI models",
	[LLMProviderType.CLAUDE]: "Claude 3.5 Sonnet, Claude 3 Opus, and other Anthropic models",
	[LLMProviderType.OPENROUTER]: "Access to multiple LLM providers through OpenRouter",
	[LLMProviderType.GEMINI]: "Gemini Pro, Gemini Flash, and other Google models",
};

function LLMProvidersPage() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingProvider, setEditingProvider] = useState<string | null>(null);

	const { data: providers = [], refetch } = trpc.llmProvider.getUserProviders.useQuery();

	const createProviderMutation = trpc.llmProvider.createProvider.useMutation({
		onSuccess: () => {
			refetch();
			setIsDialogOpen(false);
			form.reset();
		},
	});

	const updateProviderMutation = trpc.llmProvider.updateProvider.useMutation({
		onSuccess: () => {
			refetch();
			setIsDialogOpen(false);
			setEditingProvider(null);
			form.reset();
		},
	});

	const deleteProviderMutation = trpc.llmProvider.deleteProvider.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const form = useForm<ProviderFormData>({
		resolver: zodResolver(providerFormSchema),
		defaultValues: {
			providerType: LLMProviderType.OPENAI,
			displayName: "",
			apiKey: "",
		},
	});

	const onSubmit = (data: ProviderFormData) => {
		if (editingProvider) {
			updateProviderMutation.mutate({
				providerId: editingProvider,
				...data,
			});
		} else {
			createProviderMutation.mutate(data);
		}
	};

	const handleEdit = (provider: any) => {
		setEditingProvider(provider.id);
		form.setValue("providerType", provider.providerType);
		form.setValue("displayName", provider.displayName);
		form.setValue("apiKey", ""); // Don't pre-fill API key for security
		setIsDialogOpen(true);
	};

	const handleDelete = (providerId: string) => {
		if (confirm("Are you sure you want to delete this provider? This action cannot be undone.")) {
			deleteProviderMutation.mutate({ providerId });
		}
	};

	const handleDialogClose = () => {
		setIsDialogOpen(false);
		setEditingProvider(null);
		form.reset();
	};

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">LLM Providers</h1>
					<p className="text-muted-foreground">
						Manage your AI model providers and API keys
					</p>
				</div>

				<Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="h-4 w-4 mr-2" />
							Add Provider
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{editingProvider ? "Edit Provider" : "Add New Provider"}
							</DialogTitle>
							<DialogDescription>
								{editingProvider
									? "Update your provider configuration"
									: "Add a new LLM provider to use in your chats"}
							</DialogDescription>
						</DialogHeader>

						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								<FormField
									control={form.control}
									name="providerType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Provider Type</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
												disabled={!!editingProvider}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a provider" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{Object.entries(providerTypeLabels).map(([value, label]) => (
														<SelectItem key={value} value={value}>
															{label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												{field.value && providerDescriptions[field.value]}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="displayName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Display Name</FormLabel>
											<FormControl>
												<Input placeholder="My OpenAI Account" {...field} />
											</FormControl>
											<FormDescription>
												A friendly name to identify this provider
											</FormDescription>
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
													placeholder={editingProvider ? "Enter new API key (leave blank to keep current)" : "sk-..."}
													{...field}
													required={!editingProvider}
												/>
											</FormControl>
											<FormDescription>
												Your API key will be encrypted and stored securely
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={handleDialogClose}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={
											createProviderMutation.isPending ||
											updateProviderMutation.isPending
										}
									>
										{editingProvider ? "Update" : "Add"} Provider
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-4">
				{providers.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<KeyIcon className="h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-medium mb-2">No providers configured</h3>
							<p className="text-muted-foreground text-center mb-4">
								Add your first LLM provider to start using AI chat
							</p>
							<Button onClick={() => setIsDialogOpen(true)}>
								<PlusIcon className="h-4 w-4 mr-2" />
								Add Provider
							</Button>
						</CardContent>
					</Card>
				) : (
					providers.map((provider) => (
						<Card key={provider.id}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<div className="space-y-1">
									<CardTitle className="text-base flex items-center gap-2">
										{provider.displayName}
										{provider.isActive ? (
											<Badge variant="default">Active</Badge>
										) : (
											<Badge variant="secondary">Inactive</Badge>
										)}
									</CardTitle>
									<CardDescription>
										{providerTypeLabels[provider.providerType]}
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleEdit(provider)}
									>
										<EditIcon className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDelete(provider.id)}
										disabled={deleteProviderMutation.isPending}
									>
										<TrashIcon className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									{providerDescriptions[provider.providerType]}
								</p>
								<p className="text-xs text-muted-foreground mt-2">
									Added {new Date(provider.createdAt).toLocaleDateString()}
								</p>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}