"use client";

import type { ToolInvocation } from "@ai-sdk/react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { JsonViewer } from "../ui/json-viewer";

interface ToolProps {
	toolInvocation: ToolInvocation;
}

export function Tool({ toolInvocation }: ToolProps) {
	const [isCollapsed, setIsCollapsed] = useState(true);

	return (
		<div className="mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
			<div className="flex items-center gap-2 px-4">
				<CheckIcon className="size-4" />
				<p className="flex-grow">
					Used tool: <b>{toolInvocation.toolName}</b>
				</p>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setIsCollapsed(!isCollapsed)}
				>
					{isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
				</Button>
			</div>
			{!isCollapsed && (
				<div className="flex flex-col gap-2 border-t pt-2">
					<div className="px-4">
						{typeof toolInvocation.args === "object" ? (
							<JsonViewer
								data={toolInvocation.args}
								collapsed={false}
								indentWidth={20}
							/>
						) : (
							<pre className="whitespace-pre-wrap">
								{JSON.stringify(toolInvocation.args, null, 2)}
							</pre>
						)}
					</div>
					{toolInvocation.state === "result" && (
						<div className="max-h-64 border-t border-dashed px-4 pt-2">
							<p className="font-semibold">Result:</p>
							<JsonViewer
								collapsed={false}
								data={toolInvocation.result}
								enableClipboard={false}
								indentWidth={20}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
