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
import { useTRPC } from "@/integrations/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ConnectionWithUsage } from "./connections-table";

const editConnectionSchema = z.object({
	displayName: z.string().min(1, "Connection name is required"),
});

type EditConnectionFormData = z.infer<typeof editConnectionSchema>;

interface EditConnectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	connection: ConnectionWithUsage | null;
	onSave: () => void;
}

export function EditConnectionDialog({
	open,
	onOpenChange,
	connection,
	onSave,
}: EditConnectionDialogProps) {
	const trpc = useTRPC();

	const form = useForm<EditConnectionFormData>({
		resolver: zodResolver(editConnectionSchema),
		defaultValues: {
			displayName: connection?.displayName || "",
		},
		mode: "onChange",
	});

	// Reset form when connection changes
	React.useEffect(() => {
		if (connection) {
			form.reset({
				displayName: connection.displayName,
			});
		}
	}, [connection, form]);

	const updateConnectionMutation = useMutation({
		...trpc.appConnection.update.mutationOptions(),
		onSuccess: () => {
			onSave();
			onOpenChange(false);
		},
	});

	const handleSubmit = (data: EditConnectionFormData) => {
		if (!connection) return;

		updateConnectionMutation.mutate({
			id: connection.id,
			displayName: data.displayName,
		});
	};

	const handleClose = () => {
		form.reset();
		onOpenChange(false);
	};

	if (!connection) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Connection</DialogTitle>
					<DialogDescription>
						Update the details of your connection to {connection.appName}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-6"
					>
						<div className="py-4 space-y-4">
							{/* Connection Name Field */}
							<FormField
								control={form.control}
								name="displayName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Connection Name</FormLabel>
										<FormControl>
											<Input placeholder="Enter connection name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Connection Info (Read-only) */}
							<div className="space-y-2">
								<div className="text-sm">
									<span className="font-medium text-muted-foreground">
										App:
									</span>{" "}
									{connection.appName}
								</div>
								<div className="text-sm">
									<span className="font-medium text-muted-foreground">
										Status:
									</span>{" "}
									<span className="capitalize">
										{connection.status.toLowerCase()}
									</span>
								</div>
								<div className="text-sm">
									<span className="font-medium text-muted-foreground">
										Usage:
									</span>{" "}
									{connection.usageCount} MCP server(s)
								</div>
							</div>
						</div>

						<DialogFooter>
							{updateConnectionMutation.error && (
								<div className="w-full">
									<p className="text-sm text-destructive mb-2">
										{updateConnectionMutation.error.message}
									</p>
								</div>
							)}
							<Button type="button" variant="outline" onClick={handleClose}>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={
									!form.formState.isValid || updateConnectionMutation.isPending
								}
							>
								{updateConnectionMutation.isPending
									? "Saving..."
									: "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
