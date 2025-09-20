import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import {
	type OAuth2Property,
	type OAuth2Props,
	PropertyType,
	type SecretTextProperty,
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
import { z } from "zod/v4";
import { AppLogo } from "../AppLogo";
import { ViewMarkdown } from "../markdown";
import { SecretTextConnectionSettings } from "./secret-text-connection-settings";

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
					redirect_url: "https://remotemcp.tech/redirect",
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
			onSuccess: () => {
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
				<DialogContent className="max-w-11/12 md:max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
					<DialogHeader className="space-y-4 pb-6 border-b">
						<div className="flex items-center gap-4">
							<div className="p-2 rounded-xl bg-primary/10">
								<AppLogo
									logo={app.logo}
									appName={app.name}
									className="w-8 h-8 rounded-lg"
								/>
							</div>
							<div className="flex-1 text-left">
								<DialogTitle className="text-xl font-semibold">
									New Connection
								</DialogTitle>
								<DialogDescription className="text-sm text-muted-foreground mt-1">
									Create a new connection for {app?.displayName || app?.name}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(handleSubmit)}
							className="flex flex-col flex-1 overflow-hidden"
						>
							<div className="flex-1 overflow-y-auto py-3 space-y-6">
								{app.auth?.description && (
									<div className="p-1 rounded-lg bg-muted/50 border">
										<ViewMarkdown markdown={app.auth.description} />
									</div>
								)}

								<div className="space-y-6">
									<FormField
										control={form.control}
										name="request.displayName"
										rules={{
											validate: validateDisplayName,
										}}
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm font-medium">
													Connection Name
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Enter connection name"
														{...field}
														className="h-11"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="space-y-4">
										<div className="flex items-center gap-2 pb-2">
											<div className="h-px bg-border flex-1" />
											<span className="text-xs text-muted-foreground px-2 font-medium">
												AUTHENTICATION
											</span>
											<div className="h-px bg-border flex-1" />
										</div>
										{app.auth?.type === PropertyType.OAUTH2 && (
											<OAuth2ConnectionSettings
												authProperty={app.auth as OAuth2Property<OAuth2Props>}
												app={app}
											/>
										)}
										{app.auth?.type === PropertyType.SECRET_TEXT && (
											<SecretTextConnectionSettings
												authProperty={app.auth as SecretTextProperty<boolean>}
											/>
										)}
									</div>
								</div>
							</div>

							<div className="pt-6 border-t bg-background">
								{addConnectionMutation.error && (
									<div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
										<p className="text-sm text-destructive">
											{addConnectionMutation.error.message}
										</p>
									</div>
								)}
								<DialogFooter className="gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={handleClose}
										className="min-w-[100px]"
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={
											!form.formState.isValid || addConnectionMutation.isPending
										}
										className="min-w-[100px]"
									>
										{addConnectionMutation.isPending ? (
											<div className="flex items-center gap-2">
												<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
												Saving...
											</div>
										) : (
											"Save"
										)}
									</Button>
								</DialogFooter>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		);
	},
);
