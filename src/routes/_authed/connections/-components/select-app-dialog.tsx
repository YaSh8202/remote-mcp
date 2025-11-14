import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
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
import { useTRPC } from "@/integrations/trpc/react";

interface SelectAppDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAppSelect: (app: McpAppMetadata) => void;
}

export function SelectAppDialog({
	open,
	onOpenChange,
	onAppSelect,
}: SelectAppDialogProps) {
	const trpc = useTRPC();

	// Fetch available apps
	const { data: availableApps, isLoading } = useQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	// Filter apps that have auth configuration
	const appsWithAuth = availableApps?.filter((app) => app.auth != null) || [];

	const handleAppSelect = (app: McpAppMetadata) => {
		onAppSelect(app);
		onOpenChange(false);
	};

	const handleClose = () => {
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Plus className="h-5 w-5" />
						Add New Connection
					</DialogTitle>
					<DialogDescription>
						Select an app to connect to your MCP server
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="text-sm text-muted-foreground">
								Loading available apps...
							</div>
						</div>
					) : appsWithAuth.length === 0 ? (
						<div className="flex items-center justify-center py-8">
							<div className="text-sm text-muted-foreground">
								No apps with authentication available
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{appsWithAuth.map((app: McpAppMetadata) => (
								<div
									key={app.name}
									className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50 text-center"
									onClick={() => handleAppSelect(app)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											handleAppSelect(app);
										}
									}}
								>
									<div className="flex flex-col items-center gap-3">
										<AppLogo
											logo={app.logo}
											appName={app.name}
											className="h-12 w-12 rounded"
										/>

										<h3 className="font-medium text-center">
											{app.displayName}
										</h3>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
