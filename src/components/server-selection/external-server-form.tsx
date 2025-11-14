import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExternalServerFormProps {
	onSubmit: (config: {
		displayName: string;
		url: string;
		type: "http" | "sse";
		headers?: Record<string, string>;
	}) => Promise<{ success: boolean; error?: string }>;
	onBack: () => void;
	initialUrl?: string;
}

export function ExternalServerForm({
	onSubmit,
	onBack,
	initialUrl = "",
}: ExternalServerFormProps) {
	const [config, setConfig] = useState({
		displayName: "",
		url: initialUrl,
		type: "http" as "http" | "sse",
	});

	const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
		[{ key: "", value: "" }],
	);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!config.url || !config.displayName) {
			setError("Display name and URL are required");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		// Convert headers array to object, filtering out empty entries
		const headersObj = headers.reduce(
			(acc, { key, value }) => {
				if (key.trim() && value.trim()) {
					acc[key.trim()] = value.trim();
				}
				return acc;
			},
			{} as Record<string, string>,
		);

		const result = await onSubmit({
			...config,
			headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
		});

		setIsSubmitting(false);

		if (!result.success && result.error) {
			setError(result.error);
		}
	};

	const addHeaderRow = () => {
		setHeaders([...headers, { key: "", value: "" }]);
	};

	const removeHeaderRow = (index: number) => {
		setHeaders(headers.filter((_, i) => i !== index));
	};

	const updateHeader = (
		index: number,
		field: "key" | "value",
		value: string,
	) => {
		const newHeaders = [...headers];
		newHeaders[index][field] = value;
		setHeaders(newHeaders);
	};

	return (
		<div className="p-4 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={onBack}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<h3 className="font-semibold text-sm">Add External MCP Server</h3>
				</div>
			</div>

			<ScrollArea className="max-h-96">
				<div className="space-y-4 pr-4">
					{/* Display Name */}
					<div className="space-y-2">
						<Label htmlFor="displayName" className="text-sm font-medium">
							Display Name *
						</Label>
						<Input
							id="displayName"
							placeholder="My MCP Server"
							value={config.displayName}
							onChange={(e) =>
								setConfig((prev) => ({
									...prev,
									displayName: e.target.value,
								}))
							}
							className="h-9"
						/>
					</div>

					{/* URL */}
					<div className="space-y-2">
						<Label htmlFor="url" className="text-sm font-medium">
							Server URL *
						</Label>
						<Input
							id="url"
							type="url"
							placeholder="https://example.com/mcp"
							value={config.url}
							onChange={(e) =>
								setConfig((prev) => ({
									...prev,
									url: e.target.value,
								}))
							}
							className="h-9"
						/>
					</div>

					{/* Type */}
					<div className="space-y-2">
						<Label htmlFor="type" className="text-sm font-medium">
							Connection Type
						</Label>
						<div className="flex gap-2">
							<Button
								type="button"
								variant={config.type === "http" ? "default" : "outline"}
								size="sm"
								className="flex-1"
								onClick={() =>
									setConfig((prev) => ({
										...prev,
										type: "http",
									}))
								}
							>
								HTTP
							</Button>
							<Button
								type="button"
								variant={config.type === "sse" ? "default" : "outline"}
								size="sm"
								className="flex-1"
								onClick={() =>
									setConfig((prev) => ({
										...prev,
										type: "sse",
									}))
								}
							>
								SSE
							</Button>
						</div>
					</div>

					{/* Headers */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-medium">Headers (Optional)</Label>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={addHeaderRow}
								className="h-7 text-xs"
							>
								<Plus className="h-3 w-3 mr-1" />
								Add
							</Button>
						</div>
						<div className="space-y-2">
							{headers.map((header, index) => (
								<div key={index} className="flex gap-2 items-center">
									<Input
										placeholder="Key"
										value={header.key}
										onChange={(e) => updateHeader(index, "key", e.target.value)}
										className="h-8 text-sm"
									/>
									<Input
										placeholder="Value"
										value={header.value}
										onChange={(e) =>
											updateHeader(index, "value", e.target.value)
										}
										className="h-8 text-sm"
									/>
									{headers.length > 1 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="h-8 w-8 shrink-0"
											onClick={() => removeHeaderRow(index)}
										>
											<X className="h-3 w-3" />
										</Button>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</ScrollArea>

			{/* Error Message */}
			{error && (
				<div className="px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-md">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-2 pt-2 border-t">
				<Button
					variant="outline"
					size="sm"
					className="flex-1"
					onClick={onBack}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button
					size="sm"
					className="flex-1"
					onClick={handleSubmit}
					disabled={!config.url || !config.displayName || isSubmitting}
				>
					{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
					{isSubmitting ? "Validating..." : "Add Server"}
				</Button>
			</div>
		</div>
	);
}
