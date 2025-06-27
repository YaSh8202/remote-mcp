import type { McpAppMetadata } from "@/app/mcp/mcp-app/app-metadata";
import { AppLogo } from "@/components/AppLogo";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Globe } from "lucide-react";

interface AvailableAppsProps {
	appsMetadata: McpAppMetadata[];
	serverApps: Array<{ appName: string }>;
}

export function AvailableApps({
	appsMetadata,
	serverApps,
}: AvailableAppsProps) {
	const availableApps = appsMetadata.filter(
		(app: McpAppMetadata) =>
			!serverApps.some((serverApp) => serverApp.appName === app.name),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Globe className="h-5 w-5" />
					Available Applications
				</CardTitle>
				<CardDescription>
					Apps you can connect to this MCP server
				</CardDescription>
			</CardHeader>
			<CardContent>
				{availableApps.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-muted-foreground mb-4">
							All available apps are already connected to this server
						</p>
					</div>
				) : (
					<>
						<div className="flex justify-between items-center mb-4">
							<p className="text-sm text-muted-foreground">
								{availableApps.length} app
								{availableApps.length !== 1 ? "s" : ""} available
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{availableApps.map((app: McpAppMetadata) => (
								<Card
									key={app.name}
									className="hover:shadow-md transition-all duration-200"
								>
									<CardContent className="p-4">
										<div className="flex items-center gap-3 mb-3">
											<AppLogo
												logo={app.logo}
												appName={app.name}
												className="h-8 w-8 rounded"
											/>
											<div className="flex-1">
												<h3 className="font-medium">{app.name}</h3>
												<p className="text-xs text-muted-foreground">
													{app.tools.length} tools available
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
