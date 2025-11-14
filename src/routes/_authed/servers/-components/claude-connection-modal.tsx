import { CheckCircle, Copy } from "lucide-react";
import { useState } from "react";
import { ClaudeAI } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ClaudeConnectionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	serverName: string;
	serverUrl: string;
	copied: string | null;
	copyToClipboard: (text: string, type: string) => Promise<void>;
}

// Convert server name to Claude-compatible format (lowercase, hyphens only)
function sanitizeServerName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9-_]/g, "-")
		.replace(/--+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function ClaudeConnectionModal({
	open,
	onOpenChange,
	serverName,
	serverUrl,
	copied,
	copyToClipboard,
}: ClaudeConnectionModalProps) {
	const [hoveredItem, setHoveredItem] = useState<string | null>(null);

	const sanitizedName = sanitizeServerName(serverName);
	const claudeCodeCommand = `claude mcp add --transport http ${sanitizedName} ${serverUrl}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 flex-wrap">
						<ClaudeAI className="h-5 w-5 shrink-0" />
						<span>Install</span>
						<code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">
							{serverName}
						</code>
						<span>for Claude</span>
					</DialogTitle>
					{/* <DialogDescription>
						
					</DialogDescription> */}
				</DialogHeader>

				<div className="space-y-6">
					{/* For Claude Code */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							{/* <ClaudeAI className="h-4 w-4" /> */}
							<h4 className="font-medium">For Claude Code</h4>
						</div>
						<p className="text-sm text-muted-foreground">
							Run this command in Claude Code.
						</p>
						<div
							className="bg-muted p-3 rounded-lg relative group"
							onMouseEnter={() => setHoveredItem("claude-code-command")}
							onMouseLeave={() => setHoveredItem(null)}
						>
							<code className="text-xs block overflow-x-auto whitespace-pre-wrap break-all font-mono pr-10">
								{claudeCodeCommand}
							</code>
							{hoveredItem === "claude-code-command" && (
								<Button
									variant="ghost"
									size="icon"
									className="absolute top-2 right-2 h-7 w-7"
									onClick={() =>
										copyToClipboard(claudeCodeCommand, "claude-code-command")
									}
								>
									{copied === "claude-code-command" ? (
										<CheckCircle className="h-3.5 w-3.5 text-green-500" />
									) : (
										<Copy className="h-3.5 w-3.5" />
									)}
								</Button>
							)}
						</div>
					</div>

					{/* For Claude Web / Desktop */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							{/* <ClaudeAI className="h-4 w-4" /> */}
							<h4 className="font-medium">For Claude Web / Desktop</h4>
						</div>
						<p className="text-sm text-muted-foreground">
							Click "Add Custom Connector" and configure with these settings:
						</p>
						<div className="space-y-3">
							<div>
								<p className="text-sm font-medium mb-1">1. Name:</p>
								<div
									className="bg-muted p-2 rounded text-xs font-mono relative group"
									onMouseEnter={() => setHoveredItem("server-name")}
									onMouseLeave={() => setHoveredItem(null)}
								>
									<span className="pr-8 block break-all">{sanitizedName}</span>
									{hoveredItem === "server-name" && (
										<Button
											variant="ghost"
											size="icon"
											className="absolute top-1 right-1 h-6 w-6"
											onClick={() =>
												copyToClipboard(sanitizedName, "server-name")
											}
										>
											{copied === "server-name" ? (
												<CheckCircle className="h-3 w-3 text-green-500" />
											) : (
												<Copy className="h-3 w-3" />
											)}
										</Button>
									)}
								</div>
							</div>
							<div>
								<p className="text-sm font-medium mb-1">
									2. Remote MCP Server URL:
								</p>
								<div
									className="bg-muted p-2 rounded text-xs font-mono relative group"
									onMouseEnter={() => setHoveredItem("claude-url")}
									onMouseLeave={() => setHoveredItem(null)}
								>
									<span className="pr-8 block break-all">{serverUrl}</span>
									{hoveredItem === "claude-url" && (
										<Button
											variant="ghost"
											size="icon"
											className="absolute top-1 right-1 h-6 w-6"
											onClick={() => copyToClipboard(serverUrl, "claude-url")}
										>
											{copied === "claude-url" ? (
												<CheckCircle className="h-3 w-3 text-green-500" />
											) : (
												<Copy className="h-3 w-3" />
											)}
										</Button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
