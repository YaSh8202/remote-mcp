import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { ChatMcpServer } from "@/db/schema";
import { Link2, Trash2 } from "lucide-react";

interface ExternalServerDetailsPopoverProps {
	children: React.ReactNode;
	chatMcpServer: ChatMcpServer;
	onRemove?: () => void;
}

export function ExternalServerDetailsPopover({
	children,
	chatMcpServer,
	onRemove,
}: ExternalServerDetailsPopoverProps) {
	const config = chatMcpServer.config as
		| {
				url?: string;
				type?: "http" | "sse";
				headers?: Record<string, unknown>;
		  }
		| undefined;

	return (
		<Popover>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent side="top" className="w-80 p-0" align="start">
				<div className="p-4">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold text-base truncate">
								{chatMcpServer.displayName || "External Server"}
							</h3>
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
						{config?.url && (
							<div>
								<p className="text-sm font-medium mb-1">Server URL</p>
								<div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
									<Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
									<span className="text-sm truncate">{config.url}</span>
								</div>
							</div>
						)}

						{config?.type && (
							<div>
								<p className="text-sm font-medium mb-1">Connection Type</p>
								<div className="bg-muted/50 p-2 rounded-md">
									<span className="text-sm uppercase">{config.type}</span>
								</div>
							</div>
						)}

						{config?.headers && Object.keys(config.headers).length > 0 && (
							<div>
								<p className="text-sm font-medium mb-1">Headers</p>
								<div className="bg-muted/50 p-2 rounded-md space-y-1">
									{Object.entries(config.headers).map(([key, value]) => (
										<div key={key} className="text-xs flex items-start gap-2">
											<span className="font-mono text-muted-foreground">
												{key}:
											</span>
											<span className="font-mono truncate flex-1">
												{String(value)}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
