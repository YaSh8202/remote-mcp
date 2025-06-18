import { usePageHeader } from "@/store/header-store";
import { createFileRoute } from "@tanstack/react-router";
import { Home, Settings } from "lucide-react";

export const Route = createFileRoute("/_authed/")({
	component: RouteComponent,
});

function RouteComponent() {
	// Configure page header
	usePageHeader({
		breadcrumbs: [
			{ label: "Dashboard" }
		],
		actions: [
			{
				id: "settings",
				label: "Settings",
				icon: <Settings className="h-4 w-4" />,
				onClick: () => {
					console.log("Open settings");
				},
				variant: "outline" as const
			}
		]
	});

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 text-white rounded-lg">
					<Home className="h-6 w-6" />
				</div>
				<div>
					<h2 className="text-2xl font-bold">Welcome to MCP One</h2>
					<p className="text-muted-foreground">
						Manage your Model Context Protocol servers and applications
					</p>
				</div>
			</div>
			
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Dashboard content would go here */}
				<div className="p-6 border rounded-lg">
					<h3 className="font-semibold mb-2">Quick Actions</h3>
					<p className="text-sm text-muted-foreground">
						Common tasks and shortcuts
					</p>
				</div>
				<div className="p-6 border rounded-lg">
					<h3 className="font-semibold mb-2">Recent Activity</h3>
					<p className="text-sm text-muted-foreground">
						Latest server updates and connections
					</p>
				</div>
				<div className="p-6 border rounded-lg">
					<h3 className="font-semibold mb-2">System Status</h3>
					<p className="text-sm text-muted-foreground">
						Overall health and performance
					</p>
				</div>
			</div>
		</div>
	);
}
