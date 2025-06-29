import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import type { OAuth2Property, OAuth2Props } from "@/app/mcp/mcp-app/property";
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
import { AppConnectionType } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { oauth2Utils } from "@/lib/oauth2-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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

export function NewConnectionDialog({
	open,
	onOpenChange,
	app,
	onSave,
}: NewConnectionDialogProps) {
	const redirectUrl = "https://one-mcp.vercel.app/redirect";
	const authProperty = app.auth as OAuth2Property<OAuth2Props>;
	const form = useForm<NewConnectionFormData>({
		resolver: zodResolver(newConnectionSchema.refine(
			(data) => {
				// Check for duplicate connection names
				const duplicateExists = existingConnections?.some(
					(conn) => conn.displayName.toLowerCase() === data.displayName.toLowerCase()
				);
				return !duplicateExists;
			},
			{
				message: "A connection with this name already exists",
				path: ["displayName"],
			}
		)),
		defaultValues: {
			displayName: "",
		},
		mode: "onChange", // Enable real-time validation
	});
	const trpc = useTRPC();

	// Fetch existing connections to check for duplicates
	const { data: existingConnections } = useQuery(
		trpc.appConnection.listConnections.queryOptions({
			appName: app.name,
		})
	);

	const { data: appToClientIdMap } = useQuery(
		trpc.mcpApp.oauthAppsClientId.queryOptions(),
	);
	const [value, setValue] = useState<Record<string, string | undefined>>({});
	const [isConnecting, setIsConnecting] = useState(false);

	const addConnectionMutation = useMutation({
		...trpc.appConnection.create.mutationOptions(),
		onSuccess: (data) => {
			console.log("Connection created successfully:", data);
			onSave({
				displayName: form.getValues("displayName"),
			});
			form.reset();
			setValue({});
			onOpenChange(false);
		},
		onError: (error) => {
			console.error("Failed to create connection:", error);
		},
	});

	console.log("🚀 ~ appToClientIdMap:", appToClientIdMap);
	const predefinedClientId = !appToClientIdMap
		? undefined
		: appToClientIdMap[app.name]?.clientId;

	const handleSubmit = (data: NewConnectionFormData) => {
		if (!value.code) {
			return;
		}

		addConnectionMutation.mutate({
			appName: app.name,
			displayName: data.displayName,
			type: AppConnectionType.OAUTH2,
			value: {
				code: value.code,
				code_challenge: value.code_challenge,
				scope: value.scope,
				type: "OAUTH2",
				redirect_url: redirectUrl,
				props: {},
			},
		});
	};

	const handleClose = () => {
		form.reset();
		setValue({});
		onOpenChange(false);
	};

	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			await openPopup(redirectUrl, predefinedClientId ?? "", {});
		} catch (error) {
			console.error("Failed to connect:", error);
		} finally {
			setIsConnecting(false);
		}
	};

	// Check if the form is valid for enabling the Save button
	const isFormValid = form.formState.isValid && 
		form.watch("displayName") && 
		value.code && 
		!addConnectionMutation.isPending;

	async function openPopup(
		redirectUrl: string,
		clientId: string,
		props: Record<string, unknown> | undefined,
	) {
		const { authUrl, scope } = replaceVariables(
			authProperty.authUrl,
			authProperty.scope.join(" "),
			props ?? {},
		);
		const { code, codeChallenge } = await oauth2Utils.openOAuth2Popup({
			authUrl,
			clientId,
			redirectUrl,
			scope,
			pkce: authProperty.pkce ?? false,
			extraParams: authProperty.extra ?? {},
		});

		setValue({
			code,
			code_challenge: codeChallenge,
			scope: authProperty.scope.join(" "),
			type: "OAUTH2",
		});
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
										<div className="flex items-center gap-2">
											{value.code ? (
												<div className="flex items-center gap-2">
													<div className="h-2 w-2 bg-green-500 rounded-full" />
													<span className="text-xs text-green-600 font-medium">
														Connected
													</span>
												</div>
											) : (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={handleConnect}
													disabled={isConnecting}
													className="flex items-center gap-2"
												>
													{isConnecting ? "Connecting..." : "Connect"}
													{!isConnecting && <ExternalLink className="h-3 w-3" />}
												</Button>
											)}
										</div>
									</div>
									{!value.code && (
										<p className="text-xs text-destructive">
											You must authenticate with {app.name} before saving
										</p>
									)}
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
							<Button 
								type="submit" 
								disabled={!isFormValid}
							>
								{addConnectionMutation.isPending ? "Saving..." : "Save"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
