import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTRPC } from "@/integrations/trpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AppLogo } from "./AppLogo";

interface ServerDetailsPopoverProps {
	children: React.ReactNode;
	serverId: string;
	onRemove?: () => void;
}

export function ServerDetailsPopover({
	children,
	serverId,
	onRemove,
}: ServerDetailsPopoverProps) {
	const trpc = useTRPC();

	const { data: servers = [] } = useSuspenseQuery(
		trpc.mcpServer.list.queryOptions(),
	);
	const { data: availableApps } = useSuspenseQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	const server = servers.find((s) => s.id === serverId);

	if (!server) {
		return <>{children}</>;
	}

	return (
		<Popover>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent side="top" className="w-80 p-0" align="start">
				<div className="p-4">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex-1 min-w-0">
							<Link
								to={"/servers/$id"}
								params={{ id: server.id }}
								className="hover:underline"
							>
								<h3 className="font-semibold text-base truncate">
									{server.name}
								</h3>
							</Link>
						</div>
						{onRemove && (
							<Button
								variant="ghost"
								size="icon"
								onClick={(e) => {
									e.stopPropagation();
									onRemove();
								}}
								className="h-8 w-8 text-muted-foreground hover:text-destructive"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>

					<div className="space-y-3">
						{server.apps && server.apps.length > 0 && (
							<div>
								<p className="text-sm font-medium mb-2">Connected Apps</p>
								<div className="space-y-1">
									{server.apps.slice(0, 3).map((app) => (
										<div
											key={app.id}
											className="flex flex-row items-center justify-between bg-muted/50 p-2 rounded-md"
										>
											<div className="flex items-center gap-2  ">
												<AppLogo
													logo={
														availableApps.find((a) => a.name === app.appName)
															?.logo
													}
												/>
												<span className="text-sm truncate">{app.appName}</span>
											</div>
											<span className="text-xs text-muted-foreground">
												{availableApps.find((a) => a.name === app.appName)
													?.tools?.length || ""}{" "}
												tools
											</span>
										</div>
									))}
									{server.apps.length > 3 && (
										<p className="text-xs text-muted-foreground px-2">
											+{server.apps.length - 3} more apps
										</p>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
