"use client";

import { CheckCircle, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface OtherClientsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serverName: string;
	serverUrl: string;
	copied: string | null;
	copyToClipboard: (text: string, type: string) => Promise<void>;
}

export function OtherClientsModal({
	open,
	onOpenChange,
	serverName,
	serverUrl,
	copied,
	copyToClipboard,
}: OtherClientsModalProps) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Connect to Other MCP Clients</DialogTitle>
					<DialogDescription>
						Use the server URL below to connect {serverName} to any
						MCP-compatible client.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<p className="text-sm font-medium">Server URL:</p>
						<div
							className="bg-muted p-3 rounded-lg relative group"
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
						>
							<code className="text-xs block overflow-x-auto break-all font-mono pr-10">
								{serverUrl}
							</code>
							{isHovered && (
								<Button
									variant="ghost"
									size="icon"
									className="absolute top-2 right-2 h-7 w-7"
									onClick={() => copyToClipboard(serverUrl, "server-url")}
								>
									{copied === "server-url" ? (
										<CheckCircle className="h-3.5 w-3.5 text-green-500" />
									) : (
										<Copy className="h-3.5 w-3.5" />
									)}
								</Button>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
