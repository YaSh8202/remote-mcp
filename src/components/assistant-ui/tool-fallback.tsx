import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { JsonViewer } from "../ui/json-viewer";

export const ToolFallback: ToolCallMessagePartComponent = ({
	toolName,
	argsText,
	result,
}) => {
	const [isCollapsed, setIsCollapsed] = useState(true);

	const parsedArgs = useMemo(() => {
		try {
			return JSON.parse(argsText);
		} catch {
			return null;
		}
	}, [argsText]);

	return (
		<div className="mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
			<div className="flex items-center gap-2 px-4">
				<CheckIcon className="size-4" />
				<p className="flex-grow">
					Used tool: <b>{toolName}</b>
				</p>
				<Button onClick={() => setIsCollapsed(!isCollapsed)}>
					{isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
				</Button>
			</div>
			{!isCollapsed && (
				<div className="flex flex-col gap-2 border-t pt-2">
					<div className="px-4">
						{typeof parsedArgs === "object" ? (
							<JsonViewer
								data={JSON.parse(argsText)}
								collapsed={false}
								indentWidth={20}
							/>
						) : (
							<pre className="whitespace-pre-wrap">{argsText}</pre>
						)}
					</div>
					{result !== undefined && (
						<div className="border-t border-dashed px-4 pt-2 max-h-64">
							<p className="font-semibold">Result:</p>
							<JsonViewer
								collapsed={false}
								data={result}
								enableClipboard={false}
								indentWidth={20}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
