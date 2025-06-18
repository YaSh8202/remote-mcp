import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Copy, Server } from "lucide-react";

interface ServerDetailsProps {
	serverUrl: string;
	copied: string | null;
	copyToClipboard: (text: string, type: string) => Promise<void>;
}

export function ServerDetails({
	serverUrl,
	copied,
	copyToClipboard,
}: ServerDetailsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Server className="h-5 w-5" />
					Server Details
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<p className="text-sm font-medium text-muted-foreground">
						MCP URL
					</p>
					<div className="flex items-center gap-2 mt-1">
						<code className="px-2 py-1 bg-muted rounded text-xs font-mono flex-1 truncate">
							{serverUrl}
						</code>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => copyToClipboard(serverUrl, "url")}
							className="h-7 w-7 p-0"
						>
							{copied === "url" ? (
								<CheckCircle className="h-3 w-3 text-green-500" />
							) : (
								<Copy className="h-3 w-3" />
							)}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
