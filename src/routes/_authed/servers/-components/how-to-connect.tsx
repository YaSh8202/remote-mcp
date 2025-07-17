import { ClaudeAI, Cursor, VisualStudioCode } from "@/components/icons";
import {
	AnimatedTabs,
	AnimatedTabsContent,
} from "@/components/ui/animated-tabs";
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
	Copy,
	ExternalLink,
	Terminal,
	Zap,
} from "lucide-react";

const tabs = [
	{
		label: "Claude",
		value: "claude",
		icon: <ClaudeAI className="h-4 w-4" />,
	},
	{
		label: "Cursor",
		value: "cursor",
		icon: <Cursor className="h-4 w-4" />,
	},
	{
		label: "VS Code",
		value: "vscode",
		icon: <VisualStudioCode className="h-4 w-4" />,
	},
	// {
	// 	label: "Windsurf",
	// 	value: "windsurf",
	// 	icon: <Wind className="h-4 w-4" />,
	// },
	// {
	// 	label: "Others",
	// 	value: "others",
	// 	icon: <Settings className="h-4 w-4" />,
	// },
];

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

	const cursorConfig = JSON.stringify(
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

	const vscodeConfig = JSON.stringify(
		{
			servers: {
				[serverName]: {
					url: serverUrl,
				},
			},
		},
		null,
		2,
	);

	const windsurfConfig = JSON.stringify(
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
			<CardContent>
				<AnimatedTabs tabs={tabs} defaultValue="claude" className="w-full">
					<AnimatedTabsContent value="claude" className="space-y-4 mt-4">
						<div className="space-y-2 overflow-hidden">
							<h4 className="font-medium">Claude Desktop Configuration</h4>
							<p className="text-sm text-muted-foreground">
								Add this server to your Claude Desktop configuration file
								located at:
							</p>
							<div className="bg-muted p-2 rounded text-xs font-mono">
								~/Library/Application Support/Claude/claude_desktop_config.json
							</div>
							<div className="bg-muted p-3 rounded-lg">
								<code className="text-xs block overflow-scroll whitespace-pre">
									{claudeConfig}
								</code>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									className="flex-1 gap-2"
									onClick={() => copyToClipboard(claudeConfig, "claude-config")}
								>
									{copied === "claude-config" ? (
										<CheckCircle className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									Copy Configuration
								</Button>
								<Button
									variant="default"
									size="sm"
									className="flex-1 gap-2"
									asChild
								>
									<a
										href="https://www.anthropic.com/engineering/desktop-extensions"
										target="_blank"
										rel="noopener noreferrer"
									>
										<ExternalLink className="h-3 w-3" />
										Learn About Extensions
									</a>
								</Button>
							</div>
						</div>
					</AnimatedTabsContent>

					<AnimatedTabsContent value="cursor" className="space-y-4 mt-4">
						<div className="space-y-2">
							<h4 className="font-medium">Cursor AI Configuration</h4>
							<p className="text-sm text-muted-foreground">
								Add this server to your Cursor AI configuration file:
							</p>
							<div className="bg-muted p-2 rounded text-xs font-mono">
								~/.cursor/mcp_config.json
							</div>
							<div className="bg-muted p-3 rounded-lg">
								<code className="text-xs overflow-scroll block whitespace-pre">
									{cursorConfig}
								</code>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									className="flex-1 gap-2"
									onClick={() => copyToClipboard(cursorConfig, "cursor-config")}
								>
									{copied === "cursor-config" ? (
										<CheckCircle className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									Copy Configuration
								</Button>
								<Button
									variant="default"
									size="sm"
									className="flex-1 gap-2"
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
										<ExternalLink className="h-3 w-3" />
										Add to Cursor
									</a>
								</Button>
							</div>
						</div>
					</AnimatedTabsContent>

					<AnimatedTabsContent value="vscode" className="space-y-4 mt-4">
						<div className="space-y-2">
							<h4 className="font-medium">VS Code MCP Extension</h4>
							<p className="text-sm text-muted-foreground">
								Add this server to your VS Code MCP configuration file:
							</p>
							<div className="bg-muted p-2 rounded text-xs font-mono">
								.vscode/mcp.json
							</div>
							<div className="bg-muted p-3 rounded-lg">
								<code className="text-xs overflow-scroll block whitespace-pre">
									{vscodeConfig}
								</code>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									className="flex-1 gap-2"
									onClick={() => copyToClipboard(vscodeConfig, "vscode-config")}
								>
									{copied === "vscode-config" ? (
										<CheckCircle className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									Copy Configuration
								</Button>
								<Button
									variant="default"
									size="sm"
									className="flex-1 gap-2"
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
										<ExternalLink className="h-3 w-3" />
										Add to VS Code
									</a>
								</Button>
							</div>
						</div>
					</AnimatedTabsContent>

					<AnimatedTabsContent value="windsurf" className="space-y-4 mt-4">
						<div className="space-y-2">
							<h4 className="font-medium">Windsurf Configuration</h4>
							<p className="text-sm text-muted-foreground">
								Add this server to your Windsurf configuration file:
							</p>
							<div className="bg-muted p-2 rounded text-xs font-mono">
								~/.windsurf/mcp_config.json
							</div>
							<div className="bg-muted p-3 rounded-lg">
								<code className="text-xs block whitespace-pre">
									{windsurfConfig}
								</code>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									className="flex-1 gap-2"
									onClick={() =>
										copyToClipboard(windsurfConfig, "windsurf-config")
									}
								>
									{copied === "windsurf-config" ? (
										<CheckCircle className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									Copy Configuration
								</Button>
								<Button
									variant="default"
									size="sm"
									className="flex-1 gap-2"
									asChild
								>
									<a
										href="https://docs.codeium.com/windsurf/mcp"
										target="_blank"
										rel="noopener noreferrer"
									>
										<ExternalLink className="h-3 w-3" />
										Setup Guide
									</a>
								</Button>
							</div>
						</div>
					</AnimatedTabsContent>

					<AnimatedTabsContent value="others" className="space-y-4 mt-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<h4 className="font-medium flex items-center gap-2">
									<Terminal className="h-4 w-4" />
									Direct API Integration
								</h4>
								<p className="text-sm text-muted-foreground">
									Use the server URL directly in your applications:
								</p>
								<div className="bg-muted p-2 rounded text-xs font-mono break-all">
									{serverUrl}
								</div>
								<Button
									variant="outline"
									size="sm"
									className="w-full gap-2"
									onClick={() => copyToClipboard(serverUrl, "server-url")}
								>
									{copied === "server-url" ? (
										<CheckCircle className="h-3 w-3 text-green-500" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									Copy Server URL
								</Button>
							</div>

							<div className="space-y-2">
								<h4 className="font-medium flex items-center gap-2">
									<Zap className="h-4 w-4" />
									Custom Implementation
								</h4>
								<p className="text-sm text-muted-foreground">
									For custom applications, implement the Model Context Protocol
									client to connect to this server.
								</p>
								<Button variant="outline" className="w-full gap-2">
									<ExternalLink className="h-4 w-4" />
									View MCP Documentation
								</Button>
							</div>
						</div>
					</AnimatedTabsContent>
				</AnimatedTabs>
			</CardContent>
		</Card>
	);
}
