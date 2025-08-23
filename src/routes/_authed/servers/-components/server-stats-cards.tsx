import { Card, CardContent } from "@/components/ui/card";
import { useTRPC } from "@/integrations/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Activity, BarChart3, Server, Zap } from "lucide-react";

interface ServerStatsCardsProps {
	serverApps: Array<{ tools: string[] }>;
	serverId: string;
}

export function ServerStatsCards({
	serverApps,
	serverId,
}: ServerStatsCardsProps) {
	const trpc = useTRPC();

	const { data: runsCount = 0 } = useQuery(
		trpc.mcpRun.count.queryOptions({
			serverId,
		}),
	);
	const totalTools = serverApps.reduce(
		(total, app) => total + app.tools.length,
		0,
	);

	return (
		<div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
			<Card className="border-blue-200 dark:border-blue-800">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg shrink-0">
							<Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div className="min-w-0">
							<p className="text-lg font-bold">Active</p>
							<p className="text-sm text-muted-foreground">Server Status</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-green-200 dark:border-green-800">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg shrink-0">
							<Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
						</div>
						<div className="min-w-0">
							<p className="text-lg font-bold">{serverApps.length}</p>
							<p className="text-sm text-muted-foreground">Connected Apps</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-orange-200 dark:border-orange-800">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg shrink-0">
							<Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
						</div>
						<div className="min-w-0">
							<p className="text-lg font-bold">{totalTools}</p>
							<p className="text-sm text-muted-foreground">Total Tools</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Link
				to="/runs"
				search={{
					server: [serverId],
				}}
			>
				<Card className="border-purple-200 dark:border-purple-800 hover:bg-muted/50 transition-colors cursor-pointer">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg shrink-0">
								<BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
							</div>
							<div className="min-w-0">
								<p className="text-lg font-bold">{runsCount}</p>
								<p className="text-sm text-muted-foreground">Total Runs</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</Link>
		</div>
	);
}
