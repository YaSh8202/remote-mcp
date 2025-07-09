import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import {
	type OAuth2Property,
	type OAuth2Props,
	PropertyType,
} from "@/app/mcp/mcp-app/property";
import { OAuth2ConnectionSettings } from "@/components/app-connection/oauth2-connection-settings";
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
import { AppConnectionType } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { isNil } from "@/lib/utils";
import {
	UpsertAppConnectionRequestBody,
	UpsertOAuth2Request,
	UpsertSecretTextRequest,
} from "@/types/app-connection";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const newConnectionSchema = z.object({
	displayName: z.string().min(1, "Connection name is required"),
});

function createDefaultValues(
	app: McpAppMetadata,
	suggestedDisplayName: string,
): Partial<UpsertAppConnectionRequestBody> {
	if (!app.auth) {
		throw new Error(`Unsupported property type: ${app.auth}`);
	}

	switch (app.auth.type) {
		case PropertyType.SECRET_TEXT:
			return {
				displayName: suggestedDisplayName,
				appName: app.name,
				type: AppConnectionType.SECRET_TEXT,
				value: {
					type: AppConnectionType.SECRET_TEXT,
					secret_text: "",
				},
			};
		case PropertyType.OAUTH2:
			return {
				displayName: suggestedDisplayName,
				appName: app.name,
				type: AppConnectionType.OAUTH2,
				value: {
					type: AppConnectionType.OAUTH2,
					scope: app.auth.scope.join(" "),
					authorization_method: app.auth?.authorizationMethod,
					client_id: "",
					props: {},
					code: "",
					redirect_url: "https://one-mcp.vercel.app/redirect",
					code_challenge: "",
				},
			};
		default:
			throw new Error(`Unsupported property type: ${app.auth}`);
	}
}

type NewConnectionFormData = z.infer<typeof newConnectionSchema>;

function buildConnectionSchema(auth: McpAppMetadata["auth"]) {
	if (isNil(auth)) {
		return z.object({
			request: UpsertAppConnectionRequestBody,
		});
	}

	switch (auth.type) {
		case PropertyType.OAUTH2: {
			return z.object({
				request: UpsertOAuth2Request,
			});
		}
		case PropertyType.SECRET_TEXT:
			return z.object({
				request: UpsertSecretTextRequest,
			});

		default: {
			return z.object({
				request: UpsertAppConnectionRequestBody,
			});
		}
	}
}

interface NewConnectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	app: McpAppMetadata;
	onSave: (data: NewConnectionFormData) => void;
}

export const NewConnectionDialog = React.memo(
	({ open, onOpenChange, app, onSave }: NewConnectionDialogProps) => {
		const trpc = useTRPC();

		// Fetch existing connections to check for duplicates
		const { data: existingConnections } = useQuery(
			trpc.appConnection.listConnections.queryOptions({
				appName: app.name,
			}),
		);

		const existingDisplayNames = React.useMemo(() => {
			return existingConnections?.map((conn) => conn.displayName) || [];
		}, [existingConnections]);

		const formSchema = buildConnectionSchema(app.auth);
		const form = useForm<{
			request: UpsertAppConnectionRequestBody;
		}>({
			resolver: zodResolver(formSchema),
			defaultValues: {
				request: createDefaultValues(app, app.displayName),
			},
			mode: "onChange", // Enable real-time validation
			reValidateMode: "onChange",
		});

		// Add custom validation for duplicate display names
		const validateDisplayName = (value: string) => {
			if (existingDisplayNames.includes(value)) {
				return "A connection with this name already exists";
			}
			return true;
		};

		const addConnectionMutation = useMutation({
			...trpc.appConnection.upsert.mutationOptions(),
			onSuccess: (data) => {
				console.log("Connection created successfully:", data);
				onSave({
					displayName: form.getValues("request.displayName"),
				});
				form.reset();
				onOpenChange(false);
			},
			onError: (error) => {
				console.error("Failed to create connection:", error);
			},
		});

		const handleSubmit = ({
			request,
		}: { request: UpsertAppConnectionRequestBody }) => {
			// Double-check for duplicate names before submitting
			if (existingDisplayNames.includes(request.displayName)) {
				form.setError("request.displayName", {
					message: "A connection with this name already exists",
				});
				return;
			}

			addConnectionMutation.mutate(request);
		};

		const handleClose = () => {
			form.reset();
			onOpenChange(false);
		};

		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>New Connection</DialogTitle>
						<DialogDescription>
							Create a new connection for {app?.name}
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(handleSubmit)}
							className="space-y-6"
						>
							<div className="py-4 space-y-6">
								<FormField
									control={form.control}
									name="request.displayName"
									rules={{
										validate: validateDisplayName,
									}}
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
								{app.auth?.type === PropertyType.OAUTH2 && (
									<div className="mt-3.5">
										<OAuth2ConnectionSettings
											authProperty={app.auth as OAuth2Property<OAuth2Props>}
											app={app}
										/>
									</div>
								)}
							</div>

							<DialogFooter>
								{addConnectionMutation.error && (
									<div className="w-full">
										<p className="text-sm text-destructive mb-2">
											{addConnectionMutation.error.message}
										</p>
									</div>
								)}
								<Button type="button" variant="outline" onClick={handleClose}>
									Cancel
								</Button>
								<Button type="submit" disabled={!form.formState.isValid}>
									{addConnectionMutation.isPending ? "Saving..." : "Save"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		);
	},
);
