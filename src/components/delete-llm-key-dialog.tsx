import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useModels } from "@/hooks/use-models";
import { useTRPC } from "@/integrations/trpc/react";
import { getProviderById } from "@/lib/models";
import type { LLMProvider } from "@/types/models";

interface DeleteLLMKeyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	keyId: string | null;
	keyName: string;
	provider: LLMProvider;
}

export function DeleteLLMKeyDialog({
	open,
	onOpenChange,
	keyId,
	keyName,
	provider,
}: DeleteLLMKeyDialogProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const models = useModels();

	const deleteKeyMutation = useMutation({
		mutationFn: trpc.llmProvider.deleteKey.mutationOptions().mutationFn,
		onSuccess: () => {
			toast.success("API key deleted successfully");
			onOpenChange(false);
			queryClient.invalidateQueries({
				queryKey: trpc.llmProvider.getKeys.queryKey({}),
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to delete API key: ${error.message}`);
		},
	});

	const handleDelete = () => {
		if (keyId) {
			deleteKeyMutation.mutate({ keyId });
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
							<AlertTriangle className="h-5 w-5 text-destructive" />
						</div>
						<div>
							<DialogTitle>Delete API Key</DialogTitle>
							<DialogDescription className="mt-1">
								This action cannot be undone.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="py-4">
					<p className="text-sm">
						Are you sure you want to delete the API key "{keyName}" for{" "}
						{getProviderById(models, provider)?.name}?
					</p>
					<div className="mt-3 p-3 bg-muted rounded-lg">
						<p className="text-xs text-muted-foreground">
							After deletion, you won't be able to use this provider for chat
							until you add a new key.
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={deleteKeyMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteKeyMutation.isPending}
					>
						{deleteKeyMutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Delete Key
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
