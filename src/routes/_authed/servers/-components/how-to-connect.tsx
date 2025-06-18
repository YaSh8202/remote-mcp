import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	BookOpen,
	CheckCircle,
	Code,
	Copy,
	ExternalLink,
	Terminal,
} from "lucide-react";

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
	const claudeConfig = JSON.stringify(
		{
			mcpServers: {
				[serverName]: {
					command: "node",
					args: ["--experimental-websocket-client", serverUrl],
				},
			},
		},
		null,
		2,
	);

	return (
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
			<CardContent className="space-y-4">
				{/* Claude Desktop */}
				<div className="space-y-2">
					<h4 className="font-medium flex items-center gap-2">
						<Code className="h-4 w-4" />
						Claude Desktop
					</h4>
					<p className="text-sm text-muted-foreground">
						Add this server to your Claude Desktop configuration:
					</p>
					<div className="bg-muted p-3 rounded-lg">
						<code className="text-xs block">{claudeConfig}</code>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="w-full gap-2"
						onClick={() => copyToClipboard(claudeConfig, "claude-config")}
					>
						{copied === "claude-config" ? (
							<CheckCircle className="h-3 w-3 text-green-500" />
						) : (
							<Copy className="h-3 w-3" />
						)}
						Copy Configuration
					</Button>
				</div>

				{/* API Integration */}
				<div className="space-y-2">
					<h4 className="font-medium flex items-center gap-2">
						<Terminal className="h-4 w-4" />
						API Integration
					</h4>
					<p className="text-sm text-muted-foreground">
						Use the server URL directly in your applications:
					</p>
					<div className="bg-muted p-2 rounded text-xs font-mono break-all">
						{serverUrl}
					</div>
				</div>

				{/* Documentation Link */}
				<Button variant="outline" className="w-full gap-2">
					<ExternalLink className="h-4 w-4" />
					View Documentation
				</Button>
			</CardContent>
		</Card>
	);
}
