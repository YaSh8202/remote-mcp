import type { McpAppMetadata } from "@/app/mcp/mcp-app";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Globe, Plus } from "lucide-react";

interface AvailableAppsProps {
	appsMetadata: McpAppMetadata[];
	serverApps: Array<{ appName: string }>;
}

export function AvailableApps({ appsMetadata, serverApps }: AvailableAppsProps) {
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
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{availableApps.map((app: McpAppMetadata) => (
						<Card
							key={app.name}
							className="hover:shadow-md transition-all duration-200 cursor-pointer"
						>
							<CardContent className="p-4">
								<div className="flex items-center gap-3 mb-3">
									<img
										src={app.logoUrl}
										alt={app.name}
										className="h-8 w-8 rounded"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.src = "/favicon.ico";
										}}
									/>
									<div className="flex-1">
										<h3 className="font-medium">{app.name}</h3>
										<p className="text-xs text-muted-foreground">
											{app.tools.length} tools available
										</p>
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="w-full gap-2"
								>
									<Plus className="h-3 w-3" />
									Connect
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
