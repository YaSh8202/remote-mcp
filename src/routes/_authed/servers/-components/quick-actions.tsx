import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Code, Settings } from "lucide-react";

export function QuickActions() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Quick Actions</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				<Button variant="outline" className="w-full justify-start gap-2">
					<Activity className="h-4 w-4" />
					View Server Logs
				</Button>
				<Button variant="outline" className="w-full justify-start gap-2">
					<Settings className="h-4 w-4" />
					Server Settings
				</Button>
				<Button variant="outline" className="w-full justify-start gap-2">
					<Code className="h-4 w-4" />
					Export Configuration
				</Button>
			</CardContent>
		</Card>
	);
}
