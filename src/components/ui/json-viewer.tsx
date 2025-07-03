import { cn } from "@/lib/utils";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import { useTheme } from "../theme-provider";

interface JsonViewerProps {
	data: object;
	className?: string;
	collapsed?: boolean | number;
	displayDataTypes?: boolean;
	displayObjectSize?: boolean;
	enableClipboard?: boolean;
	indentWidth?: number;
	maxHeight?: string | number;
}

export function JsonViewer({
	data,
	className,
	collapsed = 2,
	displayDataTypes = false,
	displayObjectSize = false,
	enableClipboard = true,
	indentWidth = 15,
	maxHeight = 240,
}: JsonViewerProps) {
	const { theme } = useTheme();
	return (
		<div
			className={cn("rounded-md border bg-muted/10 overflow-auto", className)}
			style={{
				maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
			}}
		>
			<div className="p-3">
				<JsonView
					value={data}
					collapsed={collapsed}
					displayDataTypes={displayDataTypes}
					displayObjectSize={displayObjectSize}
					enableClipboard={enableClipboard}
					indentWidth={indentWidth}
					style={theme === "dark" ? githubDarkTheme : githubLightTheme}
				/>
			</div>
		</div>
	);
}
