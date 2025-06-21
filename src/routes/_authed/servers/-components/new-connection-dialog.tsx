import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import { PropertyType } from "@/app/mcp/mcp-app/property";
import { AppLogo } from "@/components/AppLogo";
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
import { oauth2Utils } from "@/lib/oauth2-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const newConnectionSchema = z.object({
	displayName: z.string().min(1, "Connection name is required"),
});

function replaceVariables(
	authUrl: string,
	scope: string,
	props: Record<string, unknown>,
) {
	let newAuthUrl = authUrl;
	for (const [key, value] of Object.entries(props)) {
		newAuthUrl = newAuthUrl.replace(`{${key}}`, value as string);
	}

	let newScope = scope;
	for (const [key, value] of Object.entries(props)) {
		newScope = newScope.replace(`{${key}}`, value as string);
	}
	return {
		authUrl: newAuthUrl,
		scope: newScope,
	};
}

type NewConnectionFormData = z.infer<typeof newConnectionSchema>;

interface NewConnectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	app: McpAppMetadata;
	onSave: (data: NewConnectionFormData) => void;
}

const redirectUrl = `${window.location.origin}/redirect`;

export function NewConnectionDialog({
	open,
	onOpenChange,
	app,
	onSave,
}: NewConnectionDialogProps) {
	const form = useForm<NewConnectionFormData>({
		resolver: zodResolver(newConnectionSchema),
		defaultValues: {
			displayName: "",
		},
	});
	const trpc = useTRPC();
	const [readyToConnect, setReadyToConnect] = useState(false);
	const { data: appToClientIdMap } = useQuery(
		trpc.mcpApp.oauthAppsClientId.queryOptions(),
	);
	console.log("🚀 ~ appToClientIdMap:", appToClientIdMap);
	const predefinedClientId = !appToClientIdMap
		? undefined
		: appToClientIdMap[app.name]?.clientId;

	const handleSubmit = (data: NewConnectionFormData) => {
		onSave(data);
		form.reset();
		onOpenChange(false);
	};

	const handleClose = () => {
		form.reset();
		onOpenChange(false);
	};

	const handleConnect = () => {
		// TODO: Implement OAuth connection logic
		console.log("Connecting to", app?.name);
		openPopup(redirectUrl, predefinedClientId ?? "", {});
	};

	// Check if the form is valid for enabling the Save button
	const isFormValid = form.formState.isValid && form.watch("displayName");

	async function openPopup(
		redirectUrl: string,
		clientId: string,
		props: Record<string, unknown> | undefined,
	) {
		if (app.auth?.type !== PropertyType.OAUTH2) {
			return;
		}

		const { authUrl, scope } = replaceVariables(
			app.auth.authUrl,
			app.auth.scope.join(" "),
			props ?? {},
		);
		const { code, codeChallenge } = await oauth2Utils.openOAuth2Popup({
			authUrl,
			clientId,
			redirectUrl,
			scope,
			pkce: app.auth.pkce ?? false,
			extraParams: app.auth.extra ?? {},
		});
		console.log("OAuth2 Code:", code);
		console.log("OAuth2 Code Challenge:", codeChallenge);
		// form.setValue("request.value.code", code, { shouldValidate: true });
		// form.setValue("request.value.code_challenge", codeChallenge, {
		// 	shouldValidate: true,
		// });
		// setRefresh(refresh + 1);
	}

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
							{/* App Info */}
							{app && (
								<div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
									<AppLogo
										logo={app.logo}
										appName={app.name}
										className="h-8 w-8 rounded"
									/>
									<div className="flex-1">
										<h3 className="font-medium">{app.name}</h3>
										<p className="text-xs text-muted-foreground">
											OAuth Connection
										</p>
									</div>
								</div>
							)}

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

							{/* OAuth Connect Section */}
							{app && (
								<div className="space-y-3">
									<div className="text-sm font-medium">Authentication</div>
									<div className="flex items-center justify-between p-3 border rounded-lg">
										<div className="flex items-center gap-3">
											<AppLogo
												logo={app.logo}
												appName={app.name}
												className="h-6 w-6 rounded"
											/>
											<div>
												<div className="text-sm font-medium">{app.name}</div>
												<div className="text-xs text-muted-foreground">
													OAuth 2.0
												</div>
											</div>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleConnect}
											className="flex items-center gap-2"
										>
											Connect
											<ExternalLink className="h-3 w-3" />
										</Button>
									</div>
								</div>
							)}
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={handleClose}>
								Cancel
							</Button>
							<Button type="submit" disabled={!isFormValid}>
								Save
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
