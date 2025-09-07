import { AddLLMKeyDialog } from "@/components/add-llm-key-dialog";
import { DeleteLLMKeyDialog } from "@/components/delete-llm-key-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useModels } from "@/hooks/use-models";
import { useTRPC } from "@/integrations/trpc/react";
import { getProviderById } from "@/lib/models";
import { LLMProvider } from "@/types/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle,
	Clock,
	Plus,
	RotateCcw,
	Trash2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function LLMProviderSettings() {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [deleteDialog, setDeleteDialog] = useState<{
		open: boolean;
		keyId: string | null;
		keyName: string;
		provider: LLMProvider | null;
	}>({
		open: false,
		keyId: null,
		keyName: "",
		provider: null,
	});
	const [validatingKeys, setValidatingKeys] = useState<Record<string, boolean>>(
		{},
	);
	const modelsData = useModels();

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// tRPC queries and mutations
	const { data: keys = [], isLoading } = useQuery(
		trpc.llmProvider.getKeys.queryOptions({}),
	);

	const revalidateKeyMutation = useMutation({
		mutationFn: trpc.llmProvider.revalidateKey.mutationOptions().mutationFn,
		onSuccess: (result: { success: boolean; isValid?: boolean }) => {
			if (result.isValid) {
				toast.success("API key is valid");
			} else {
				toast.error("API key is invalid");
			}
			queryClient.invalidateQueries({
				queryKey: trpc.llmProvider.getKeys.queryKey({}),
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to validate API key: ${error.message}`);
		},
	});

	const handleDeleteKey = (
		keyId: string,
		keyName: string,
		provider: LLMProvider,
	) => {
		setDeleteDialog({
			open: true,
			keyId,
			keyName,
			provider,
		});
	};

	const handleRevalidateKey = async (keyId: string) => {
		setValidatingKeys((prev) => ({ ...prev, [keyId]: true }));
		try {
			await revalidateKeyMutation.mutateAsync({ keyId });
		} finally {
			setValidatingKeys((prev) => ({ ...prev, [keyId]: false }));
		}
	};

	const getValidationIcon = (isValid: boolean | null) => {
		if (isValid === null) return <Clock className="h-4 w-4 text-yellow-500" />;
		if (isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
		return <XCircle className="h-4 w-4 text-red-500" />;
	};

	const getValidationBadge = (isValid: boolean | null) => {
		if (isValid === null) return <Badge variant="secondary">Pending</Badge>;
		if (isValid)
			return (
				<Badge
					variant="default"
					className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
				>
					Valid
				</Badge>
			);
		return <Badge variant="destructive">Invalid</Badge>;
	};

	const existingProviders = keys.map((key) => key.provider as LLMProvider);
	const canAddMore =
		existingProviders.length < Object.values(LLMProvider).length;

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>LLM Provider API Keys</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2].map((i) => (
							<div
								key={i}
								className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
							>
								<div className="flex items-center space-x-4 flex-1">
									<div className="flex-1">
										<div className="h-4 bg-muted rounded w-32 mb-2" />
										<div className="h-3 bg-muted rounded w-24" />
									</div>
								</div>
								<div className="h-8 bg-muted rounded w-20" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>LLM Provider API Keys</CardTitle>
					<CardDescription>
						Manage your API keys for different LLM providers. Keys are encrypted
						and stored securely. You must add at least one valid API key to use
						the chat feature.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Existing Keys */}
					<div className="space-y-4">
						{keys.length === 0 ? (
							<div className="text-center py-12">
								<div className="mx-auto w-24 h-24 mb-4 flex items-center justify-center rounded-full bg-muted">
									<Plus className="h-10 w-10 text-muted-foreground" />
								</div>
								<h3 className="text-lg font-medium mb-2">
									No API keys added yet
								</h3>
								<p className="text-muted-foreground mb-4">
									Add your first API key to start using the chat feature
								</p>
								<Button onClick={() => setIsAddDialogOpen(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Add Your First Key
								</Button>
							</div>
						) : (
							keys.map((key) => (
								<div
									key={key.id}
									className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-center space-x-4 flex-1">
										<div className="flex-1">
											<div className="flex items-center space-x-2 mb-1">
												<span className="font-medium">{`${getProviderById(modelsData, key.provider).displayName} Key`}</span>
												{getValidationIcon(key.isValid)}
											</div>
											<div className="flex items-center space-x-2 text-sm text-muted-foreground">
												<span>
													{
														getProviderById(modelsData, key.provider)
															.displayName
													}
												</span>
												{getValidationBadge(key.isValid)}
												{key.isDefault && (
													<Badge variant="outline">Default</Badge>
												)}
											</div>
											{key.lastValidated && (
												<p className="text-xs text-muted-foreground mt-1">
													Last validated:{" "}
													{new Date(key.lastValidated).toLocaleDateString()}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleRevalidateKey(key.id)}
											disabled={
												validatingKeys[key.id] ||
												revalidateKeyMutation.isPending
											}
										>
											{validatingKeys[key.id] ? (
												<RotateCcw className="h-4 w-4 animate-spin" />
											) : (
												<RotateCcw className="h-4 w-4" />
											)}
											<span className="ml-2 hidden sm:inline">Revalidate</span>
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleDeleteKey(
													key.id,
													`${getProviderById(modelsData, key.provider).displayName} Key`,
													key.provider,
												)
											}
											className="text-destructive hover:text-destructive hover:bg-destructive/10"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))
						)}
					</div>

					{/* Add New Key Button */}
					{keys.length > 0 && (
						<div className="pt-4 border-t">
							<Button
								onClick={() => setIsAddDialogOpen(true)}
								variant="outline"
								className="w-full"
								disabled={!canAddMore}
							>
								<Plus className="h-4 w-4 mr-2" />
								{canAddMore ? "Add Another Key" : "All Providers Configured"}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialogs */}
			<AddLLMKeyDialog
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				existingProviders={existingProviders}
			/>

			{deleteDialog.keyName && deleteDialog.provider && (
				<DeleteLLMKeyDialog
					open={deleteDialog.open}
					onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
					keyId={deleteDialog.keyId}
					keyName={deleteDialog.keyName}
					provider={deleteDialog.provider}
				/>
			)}
		</>
	);
}
