import { Server } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";

interface App {
	name: string;
	logo?:
		| {
				type: "icon";
				icon: string;
		  }
		| {
				type: "url";
				url: string;
		  };
}

interface ServerCardProps {
	name: string;
	apps: App[];
	onClick: () => void;
}

export function ServerCard({ name, apps, onClick }: ServerCardProps) {
	return (
		<div
			onClick={onClick}
			className="flex items-center gap-3 p-1 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 group"
		>
			{/* Server Icon */}
			<div className="flex h-7 items-center justify-center rounded-md  group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
				{apps.length === 0 ? (
					<div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/70 border border-background">
						<Server className="h-4 w-4 text-primary" />
					</div>
				) : (
					<div className="flex -space-x-3">
						{apps.slice(0, 3).map((app) => (
							<div
								key={app.name}
								className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/70 border border-background"
							>
								<AppLogo key={app.name} logo={app.logo} className="h-4 w-4" />
							</div>
						))}
					</div>
				)}
			</div>
			{/* Server Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p className="font-medium text-sm truncate group-hover:text-foreground transition-colors">
						{name}
					</p>
				</div>
			</div>
		</div>
	);
}
