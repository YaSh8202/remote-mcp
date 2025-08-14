import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useUserSession } from "@/hooks/auth";
import { useCommonTranslation, useSettingsTranslation } from "@/hooks/use-translation";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Database,
	Globe,
	Languages,
	Monitor,
	Palette,
	Trash2,
	User,
} from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";

export const Route = createFileRoute("/_authed/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const { user } = useUserSession();
	const { theme, setTheme } = useTheme();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t: tCommon } = useCommonTranslation();
	const { t: tSettings } = useSettingsTranslation();

	const [language, setLanguage] = useLocalStorage("language", "en");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	// Fetch user settings
	const { data: userSettings, isLoading: isLoadingSettings } = useQuery(
		trpc.userSettings.get.queryOptions(),
	);

	// Update user settings mutation with optimistic updates
	const updateSettingsMutation = useMutation({
		mutationFn: trpc.userSettings.update.mutationOptions().mutationFn,
		// When mutate is called:
		onMutate: async (newSettings: {
			enableLogging?: boolean;
			autoRetry?: boolean;
		}) => {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries({
				queryKey: trpc.userSettings.get.queryKey(),
			});

			// Snapshot the previous value
			const previousSettings = queryClient.getQueryData(
				trpc.userSettings.get.queryKey(),
			);

			// Optimistically update to the new value
			queryClient.setQueryData(
				trpc.userSettings.get.queryKey(),
				(old: typeof userSettings) => {
					if (!old) return old;
					return {
						...old,
						...newSettings,
					};
				},
			);

			// Return a context object with the snapshotted value
			return { previousSettings };
		},
		// If the mutation fails, use the context returned from onMutate to roll back
		onError: (
			_err: Error,
			_newSettings: { enableLogging?: boolean; autoRetry?: boolean },
			context: { previousSettings?: typeof userSettings } | undefined,
		) => {
			if (context?.previousSettings) {
				queryClient.setQueryData(
					trpc.userSettings.get.queryKey(),
					context.previousSettings,
				);
			}
		},
		// Always refetch after error or success:
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.userSettings.get.queryKey(),
			});
		},
	});

	const updateUserSetting = async (
		key: "enableLogging" | "autoRetry",
		value: boolean,
	) => {
		updateSettingsMutation.mutate({
			[key]: value,
		});
	};

	usePageHeader({
		breadcrumbs: [{ label: tSettings("title") }],
	});

	return (
		<div className="max-w-4xl mx-2 space-y-8">
			<div className="space-y-2">
				<p className="text-muted-foreground">
					{tSettings("description")}
				</p>
			</div>

			{/* Profile Section */}
			<section className="space-y-6">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<User className="h-5 w-5" />
						<h2 className="text-xl font-semibold">{tSettings("profile.title")}</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						{tSettings("profile.description")}
					</p>
				</div>

				<div className="flex items-center gap-4">
					<Avatar className="h-[5.5rem] w-[5.5rem]">
						<AvatarImage src={user.image || ""} alt={user.name} />
						<AvatarFallback className="text-lg">
							{user.name?.charAt(0)?.toUpperCase() || "U"}
						</AvatarFallback>
					</Avatar>
					<div className="space-y-1">
						<h3 className="text-xl font-medium">{user.name}</h3>
						<p className="text-md text-muted-foreground">{user.email}</p>
					</div>
				</div>
			</section>

			<Separator />

			{/* General Section */}
			<section className="space-y-6">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Monitor className="h-5 w-5" />
						<h2 className="text-xl font-semibold">{tSettings("general.title")}</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						{tSettings("general.description")}
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>{tSettings("general.interface_preferences.title")}</CardTitle>
						<CardDescription>
							{tSettings("general.interface_preferences.description")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="space-y-3">
								<Label
									htmlFor="theme"
									className="flex items-center gap-2 text-sm font-medium"
								>
									<Palette className="h-4 w-4" />
									{tSettings("general.theme.label")}
								</Label>
								<Select
									value={theme}
									onValueChange={(value) =>
										// updateSetting("general", "theme", value)
										setTheme(value)
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select theme" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem
											value="light"
											className="flex items-center gap-2"
										>
											<span>{tCommon("theme.light")}</span>
										</SelectItem>
										<SelectItem
											value="dark"
											className="flex items-center gap-2"
										>
											<span>{tCommon("theme.dark")}</span>
										</SelectItem>
										<SelectItem
											value="system"
											className="flex items-center gap-2"
										>
											<span>{tCommon("theme.system")}</span>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-3">
								<Label
									htmlFor="language"
									className="flex items-center gap-2 text-sm font-medium"
								>
									<Languages className="h-4 w-4" />
									{tSettings("general.language.label")}
								</Label>
								<Select
									value={language}
									onValueChange={(value) => setLanguage(value)}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select language" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="en" className="flex items-center gap-2">
											<span>{tCommon("language.en")}</span>
										</SelectItem>
										<SelectItem value="es" className="flex items-center gap-2">
											<span>{tCommon("language.es")}</span>
										</SelectItem>
										<SelectItem value="fr" className="flex items-center gap-2">
											<span>{tCommon("language.fr")}</span>
										</SelectItem>
										<SelectItem value="de" className="flex items-center gap-2">
											<span>{tCommon("language.de")}</span>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>
			</section>

			<Separator />

			{/* MCP Section */}
			<section className="space-y-6">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Globe className="h-5 w-5" />
						<h2 className="text-xl font-semibold">{tSettings("mcp.title")}</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						{tSettings("mcp.description")}
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>{tSettings("mcp.advanced_options.title")}</CardTitle>
						<CardDescription>
							{tSettings("mcp.advanced_options.description")}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{isLoadingSettings ? (
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-3 w-48" />
									</div>
									<Skeleton className="h-6 w-10" />
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-40" />
									</div>
									<Skeleton className="h-6 w-10" />
								</div>
							</div>
						) : (
							<>
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<Label className="text-base">{tSettings("mcp.enable_logging.title")}</Label>
										<p className="text-sm text-muted-foreground">
											{tSettings("mcp.enable_logging.description")}
										</p>
									</div>
									<Switch
										checked={userSettings?.enableLogging ?? true}
										onCheckedChange={(checked) =>
											updateUserSetting("enableLogging", checked)
										}
										disabled={updateSettingsMutation.isPending}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<Label className="text-base">
											{tSettings("mcp.auto_retry.title")}
										</Label>
										<p className="text-sm text-muted-foreground">
											{tSettings("mcp.auto_retry.description")}
										</p>
									</div>
									<Switch
										checked={userSettings?.autoRetry ?? true}
										onCheckedChange={(checked) =>
											updateUserSetting("autoRetry", checked)
										}
										disabled={updateSettingsMutation.isPending}
									/>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</section>

			<Separator />

			{/* Storage Section */}
			<StorageSection />

			<Separator />

			{/* Danger Zone */}
			<section className="space-y-6">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Trash2 className="h-5 w-5 text-destructive" />
						<h2 className="text-xl font-semibold text-destructive">
							{tSettings("danger_zone.title")}
						</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						{tSettings("danger_zone.description")}
					</p>
				</div>

				<Card className="border-destructive/50">
					<CardHeader>
						<CardTitle className="text-destructive">{tSettings("danger_zone.delete_account.title")}</CardTitle>
						<CardDescription>
							{tSettings("danger_zone.delete_account.description")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							variant="destructive"
							className="w-full"
							onClick={() => setDeleteDialogOpen(true)}
						>
							{tSettings("danger_zone.delete_account.button")}
						</Button>
					</CardContent>
				</Card>
			</section>

			{/* Delete Account Dialog */}
			<DeleteAccountDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			/>
		</div>
	);
}

const mcpServerLimit = 25;
const appConnectionLimit = 100;
export function StorageSection() {
	const trpc = useTRPC();
	const { t: tSettings } = useSettingsTranslation();
	const { data: mcpServerCount, isLoading: isServerCountLoading } = useQuery(
		trpc.mcpServer.count.queryOptions(),
	);
	const { data: appConnectionCount, isLoading: isConnectionCountLoading } =
		useQuery(trpc.appConnection.count.queryOptions());

	const serverFillPercent = Math.round(
		((mcpServerCount ?? 0) / mcpServerLimit) * 100,
	);
	const connectionFillPercent = Math.round(
		((appConnectionCount ?? 0) / appConnectionLimit) * 100,
	);

	return (
		<section className="space-y-6">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<Database className="h-5 w-5" />
					<h2 className="text-xl font-semibold">{tSettings("storage.title")}</h2>
				</div>
				<p className="text-sm text-muted-foreground">
					{tSettings("storage.description")}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{tSettings("storage.usage.title")}</CardTitle>
					<CardDescription>
						{tSettings("storage.usage.description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Servers */}
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="font-medium">{tSettings("storage.servers")}</span>
							{isServerCountLoading ? (
								<Skeleton className="h-4 w-16" />
							) : (
								<span className="text-muted-foreground">
									{mcpServerCount} / {mcpServerLimit}
								</span>
							)}
						</div>
						{isServerCountLoading ? (
							<Skeleton className="w-full h-2 rounded-full" />
						) : (
							<div className="w-full bg-secondary rounded-full h-2">
								<div
									className="bg-primary h-2 rounded-full transition-all"
									style={{ width: `${serverFillPercent}%` }}
								/>
							</div>
						)}
					</div>

					{/* Connections */}
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="font-medium">{tSettings("storage.connections")}</span>
							{isConnectionCountLoading ? (
								<Skeleton className="h-4 w-16" />
							) : (
								<span className="text-muted-foreground">
									{appConnectionCount} / {appConnectionLimit}
								</span>
							)}
						</div>
						{isConnectionCountLoading ? (
							<Skeleton className="w-full h-2 rounded-full" />
						) : (
							<div className="w-full bg-secondary rounded-full h-2">
								<div
									className="bg-primary h-2 rounded-full transition-all"
									style={{ width: `${connectionFillPercent}%` }}
								/>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</section>
	);
}
