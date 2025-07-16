import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/integrations/trpc/react";
import { signOut } from "@/lib/auth-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({
	open,
	onOpenChange,
}: DeleteAccountDialogProps) {
	const [confirmationText, setConfirmationText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);
	const queryClient = useQueryClient();
	const router = useRouter();
	const trpc = useTRPC();

	const deleteAccountMutation = useMutation({
		...trpc.user.deleteAccount.mutationOptions(),
		onSuccess: async () => {
			// Sign out the user and redirect to login
			await signOut();
			await queryClient.clear();
			router.navigate({ to: "/login" });
			toast.success("Account deleted successfully");
		},
		onError: (error) => {
			toast.error(`Failed to delete account: ${error.message}`);
		},
		onSettled: () => {
			setIsDeleting(false);
		},
	});

	const isConfirmationValid = confirmationText === "delete my account";

	const handleDelete = async () => {
		if (!isConfirmationValid) return;

		setIsDeleting(true);
		deleteAccountMutation.mutate();
	};

	const handleCancel = () => {
		setConfirmationText("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<Trash2 className="h-5 w-5" />
						Delete Account
					</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove all your data from our servers.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Warning Section */}
					<div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
						<AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
						<div className="space-y-2">
							<h4 className="font-medium text-destructive">
								This will delete:
							</h4>
							<ul className="text-sm text-muted-foreground space-y-1">
								<li>• All your MCP servers and configurations</li>
								<li>• All your app connections and credentials</li>
								<li>• All your run history and logs</li>
								<li>• Your profile and account information</li>
							</ul>
						</div>
					</div>

					{/* Confirmation Input */}
					<div className="space-y-2">
						<Label htmlFor="confirmation">
							To confirm, type{" "}
							<span className="font-mono font-semibold">delete my account</span>{" "}
							below:
						</Label>
						<Input
							id="confirmation"
							type="text"
							value={confirmationText}
							onChange={(e) => setConfirmationText(e.target.value)}
							placeholder="delete my account"
							className="font-mono"
							disabled={isDeleting}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={!isConfirmationValid || isDeleting}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						{isDeleting ? "Deleting..." : "Delete Account"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
