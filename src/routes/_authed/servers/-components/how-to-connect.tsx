"use client";

import { ClaudeAI, Cursor, VisualStudioCode } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BookOpen, ExternalLink, Settings } from "lucide-react";
import { useState } from "react";
import { ClaudeConnectionModal } from "./claude-connection-modal";
import { OtherClientsModal } from "./other-clients-modal";

interface HowToConnectProps {
	serverName: string;
	serverUrl: string;
	copied: string | null;
	copyToClipboard: (text: string, type: string) => Promise<void>;
}

export function HowToConnect({
	serverName,
	serverUrl,
	copied,
	copyToClipboard,
}: HowToConnectProps) {
	const [showClaudeModal, setShowClaudeModal] = useState(false);
	const [showOtherClientsModal, setShowOtherClientsModal] = useState(false);

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="h-5 w-5" />
						How to Connect
					</CardTitle>
					<CardDescription>
						Connect this MCP server to your AI applications
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{/* VS Code Button */}
					<Button
						variant="outline"
						className="w-full justify-start gap-3 h-auto py-3"
						asChild
					>
						<a
							href={`vscode:mcp/install?${encodeURIComponent(
								JSON.stringify({
									name: serverName,
									url: serverUrl,
								}),
							)}`}
						>
							<VisualStudioCode className="h-5 w-5 shrink-0" />
							<div className="flex-1 text-left">
								<div className="font-medium">Add to VS Code</div>
								<div className="text-xs text-muted-foreground">
									Install directly in VS Code
								</div>
							</div>
							<ExternalLink className="h-4 w-4 shrink-0" />
						</a>
					</Button>

					{/* Cursor Button */}
					<Button
						variant="outline"
						className="w-full justify-start gap-3 h-auto py-3"
						asChild
					>
						<a
							href={`cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(
								serverName,
							)}&config=${encodeURIComponent(
								btoa(
									JSON.stringify({
										url: serverUrl,
										type: "http",
									}),
								),
							)}`}
						>
							<Cursor className="h-5 w-5 shrink-0" />
							<div className="flex-1 text-left">
								<div className="font-medium">Add to Cursor</div>
								<div className="text-xs text-muted-foreground">
									Install directly in Cursor AI
								</div>
							</div>
							<ExternalLink className="h-4 w-4 shrink-0" />
						</a>
					</Button>

					{/* Claude Button */}
					<Button
						variant="outline"
						className="w-full justify-start gap-3 h-auto py-3"
						onClick={() => setShowClaudeModal(true)}
					>
						<ClaudeAI className="h-5 w-5 shrink-0" />
						<div className="flex-1 text-left">
							<div className="font-medium">Add to Claude</div>
							<div className="text-xs text-muted-foreground">
								Connect to Claude Code, Web, or Desktop
							</div>
						</div>
					</Button>

					{/* Other Clients Button */}
					<Button
						variant="outline"
						className="w-full justify-start gap-3 h-auto py-3"
						onClick={() => setShowOtherClientsModal(true)}
					>
						<Settings className="h-5 w-5 shrink-0" />
						<div className="flex-1 text-left">
							<div className="font-medium">Add to Other Clients</div>
							<div className="text-xs text-muted-foreground">
								Get server URL for manual configuration
							</div>
						</div>
					</Button>
				</CardContent>
			</Card>

			{/* Modals */}
			<ClaudeConnectionModal
				open={showClaudeModal}
				onOpenChange={setShowClaudeModal}
				serverName={serverName}
				serverUrl={serverUrl}
				copied={copied}
				copyToClipboard={copyToClipboard}
			/>

			<OtherClientsModal
				open={showOtherClientsModal}
				onOpenChange={setShowOtherClientsModal}
				serverName={serverName}
				serverUrl={serverUrl}
				copied={copied}
				copyToClipboard={copyToClipboard}
			/>
		</>
	);
}
