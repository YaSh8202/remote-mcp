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
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Database,
	Globe,
	Languages,
	Monitor,
	Palette,
	Save,
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
	const [settings, setSettings] = useState({
		mcp: {
			enableLogging: true,
			autoRetry: true,
			// retryAttempts: 3,
		},
	});
	const [language, setLanguage] = useLocalStorage("language", "en");

	const [hasChanges, setHasChanges] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	usePageHeader({
		breadcrumbs: [{ label: "Settings" }],
	});

	const updateSetting = (section: string, key: string, value: unknown) => {
		setSettings((prev) => ({
			...prev,
			[section]: {
				...prev[section as keyof typeof prev],
				[key]: value,
			},
		}));
		setHasChanges(true);
	};

	const saveSettings = async () => {
		// TODO: Implement API call to save settings
		console.log("Saving settings...", settings);
		setHasChanges(false);
	};

	return (
		<div className="max-w-4xl mx-2 space-y-8">
			<div className="space-y-2">
				<p className="text-muted-foreground">
					Manage your account settings and MCP server preferences
				</p>
			</div>

			{/* Profile Section */}
			<section className="space-y-6">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<User className="h-5 w-5" />
						<h2 className="text-xl font-semibold">Profile</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						Your profile information from your account.
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
						<h2 className="text-xl font-semibold">General</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						Customize how Remote Mcp looks and behaves.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Interface Preferences</CardTitle>
						<CardDescription>
							Configure the appearance and language settings.
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
									Theme
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
											<span>☀️ Light</span>
										</SelectItem>
										<SelectItem
											value="dark"
											className="flex items-center gap-2"
										>
											<span>🌙 Dark</span>
										</SelectItem>
										<SelectItem
											value="system"
											className="flex items-center gap-2"
										>
											<span>💻 System</span>
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
									Language
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
											<span>🇺🇸 English</span>
										</SelectItem>
										<SelectItem value="es" className="flex items-center gap-2">
											<span>🇪🇸 Spanish</span>
										</SelectItem>
										<SelectItem value="fr" className="flex items-center gap-2">
											<span>🇫🇷 French</span>
										</SelectItem>
										<SelectItem value="de" className="flex items-center gap-2">
											<span>🇩🇪 German</span>
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
						<h2 className="text-xl font-semibold">MCP Configuration</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						Configure default settings for your MCP servers and connections.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Advanced Options</CardTitle>
						<CardDescription>
							Configure advanced MCP server behavior and features.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="text-base">Enable Logging</Label>
								<p className="text-sm text-muted-foreground">
									Log all MCP server interactions and errors
								</p>
							</div>
							<Switch
								checked={settings.mcp.enableLogging}
								onCheckedChange={(checked) =>
									updateSetting("mcp", "enableLogging", checked)
								}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<Label className="text-base">Auto Retry Failed Tool Runs</Label>
								<p className="text-sm text-muted-foreground">
									Automatically retry failed tool runs
								</p>
							</div>
							<Switch
								checked={settings.mcp.autoRetry}
								onCheckedChange={(checked) =>
									updateSetting("mcp", "autoRetry", checked)
								}
							/>
						</div>
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
							Danger Zone
						</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						Permanent actions that cannot be undone.
					</p>
				</div>

				<Card className="border-destructive/50">
					<CardHeader>
						<CardTitle className="text-destructive">Delete Account</CardTitle>
						<CardDescription>
							Once you delete your account, there is no going back. Please be
							certain.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							variant="destructive"
							className="w-full"
							onClick={() => setDeleteDialogOpen(true)}
						>
							Delete Account
						</Button>
					</CardContent>
				</Card>
			</section>

			{/* Floating Save Button */}
			{hasChanges && (
				<div className="fixed bottom-6 right-6 z-50">
					<Button onClick={saveSettings} size="lg" className="shadow-lg">
						<Save className="h-4 w-4 mr-2" />
						Save Changes
					</Button>
				</div>
			)}

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
					<h2 className="text-xl font-semibold">Storage & Data</h2>
				</div>
				<p className="text-sm text-muted-foreground">
					Control how your data is stored, backed up, and retained.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Storage Usage</CardTitle>
					<CardDescription>
						Monitor your current storage usage and limits.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Servers */}
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="font-medium">Servers</span>
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
							<span className="font-medium">Connections</span>
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
