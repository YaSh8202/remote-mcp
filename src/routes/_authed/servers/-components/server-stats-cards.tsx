import { Card, CardContent } from "@/components/ui/card";
import { Activity, Globe, Server, Zap } from "lucide-react";

interface ServerStatsCardsProps {
	serverApps: Array<{ tools: string[] }>;
	createdAt: Date | string;
	formatDate: (date: Date) => string;
}

export function ServerStatsCards({
	serverApps,
	createdAt,
	formatDate,
}: ServerStatsCardsProps) {
	const totalTools = serverApps.reduce(
		(total, app) => total + app.tools.length,
		0,
	);

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
			<Card className="border-blue-200 dark:border-blue-800">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
							<Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-lg font-bold">Active</p>
							<p className="text-sm text-muted-foreground">Server Status</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-green-200 dark:border-green-800">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
							<Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<p className="text-lg font-bold">{serverApps.length}</p>
							<p className="text-sm text-muted-foreground">Connected Apps</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-orange-200 dark:border-orange-800">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
							<Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
						</div>
						<div>
							<p className="text-lg font-bold">{totalTools}</p>
							<p className="text-sm text-muted-foreground">Total Tools</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-purple-200 dark:border-purple-800">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
							<Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
						</div>
						<div>
							<p className="text-lg font-bold">
								{formatDate(new Date(createdAt))}
							</p>
							<p className="text-sm text-muted-foreground">Created</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
