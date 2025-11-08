import { Link } from "@tanstack/react-router";
import { Server } from "lucide-react";
import { Button } from "../ui/button";
import { ServerCard } from "./server-card";

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

interface ServerItem {
	id: string;
	name: string;
	apps: App[];
}

interface ServerListProps {
	servers: ServerItem[];
	onServerClick: (serverId: string) => void;
	emptyMessage?: string;
	emptySubMessage?: string;
}

export function ServerList({
	servers,
	onServerClick,
	emptyMessage = "No servers found",
	emptySubMessage,
}: ServerListProps) {
	if (servers.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<Server className="h-8 w-8 mx-auto opacity-50 mb-2" />
				<p className="text-sm text-muted-foreground">{emptyMessage}</p>
				{emptySubMessage && (
					<p className="text-xs text-muted-foreground mt-1">
						{emptySubMessage}
					</p>
				)}
				<Link to="/servers" target="_blank">
					<Button size={"sm"} variant="outline" className="mt-4">
						Add Server
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{servers.map((server) => (
				<ServerCard
					key={server.id}
					name={server.name}
					apps={server.apps}
					onClick={() => onServerClick(server.id)}
				/>
			))}
		</div>
	);
}
