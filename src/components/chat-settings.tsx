import { useState } from "react";
import { SettingsIcon, BrainIcon, ServerIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/integrations/trpc/react";
import { ChatMCPServers } from "./chat-mcp-servers";
import { LLMService } from "@/services/llm-service";

interface ChatSettingsProps {
	chatId: string;
	currentProviderId?: string;
	systemPrompt?: string;
	mcpServerIds: string[];
	onUpdate: (updates: {
		llmProviderId?: string;
		systemPrompt?: string;
		mcpServerIds?: string[];
	}) => void;
}

export function ChatSettings({
	chatId,
	currentProviderId,
	systemPrompt,
	mcpServerIds,
	onUpdate,
}: ChatSettingsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedProviderId, setSelectedProviderId] = useState(currentProviderId || "");
	const [selectedModel, setSelectedModel] = useState("");
	const [promptText, setPromptText] = useState(systemPrompt || "");

	const { data: providers = [] } = trpc.llmProvider.getUserProviders.useQuery();
	const updateChatMutation = trpc.chat.updateChat.useMutation({
		onSuccess: () => {
			setIsOpen(false);
		},
	});

	const selectedProvider = providers.find(p => p.id === selectedProviderId);
	const availableModels = selectedProvider 
		? LLMService.getDefaultModels(selectedProvider.providerType)
		: [];

	const handleSave = () => {
		const updates: any = {};
		
		if (selectedProviderId !== currentProviderId) {
			updates.llmProviderId = selectedProviderId || null;
		}
		
		if (promptText !== systemPrompt) {
			updates.systemPrompt = promptText || null;
		}

		if (Object.keys(updates).length > 0) {
			updateChatMutation.mutate({
				chatId,
				...updates,
			});
			onUpdate(updates);
		} else {
			setIsOpen(false);
		}
	};

	const handleMCPServersUpdate = (serverIds: string[]) => {
		onUpdate({ mcpServerIds: serverIds });
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm">
					<SettingsIcon className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Chat Settings</DialogTitle>
					<DialogDescription>
						Configure the AI provider, model, and tools for this conversation.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* LLM Provider Settings */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<BrainIcon className="h-4 w-4" />
							<h4 className="font-medium">AI Provider</h4>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Provider</Label>
								<Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
									<SelectTrigger>
										<SelectValue placeholder="Select provider" />
									</SelectTrigger>
									<SelectContent>
										{providers.map((provider) => (
											<SelectItem key={provider.id} value={provider.id}>
												{provider.displayName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Model</Label>
								<Select value={selectedModel} onValueChange={setSelectedModel}>
									<SelectTrigger>
										<SelectValue placeholder="Select model" />
									</SelectTrigger>
									<SelectContent>
										{availableModels.map((model) => (
											<SelectItem key={model} value={model}>
												{model}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label>System Prompt</Label>
							<Textarea
								value={promptText}
								onChange={(e) => setPromptText(e.target.value)}
								placeholder="Enter a system prompt to guide the AI's behavior..."
								rows={3}
							/>
						</div>
					</div>

					<Separator />

					{/* MCP Servers */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<ServerIcon className="h-4 w-4" />
							<h4 className="font-medium">Tools & Capabilities</h4>
						</div>

						<ChatMCPServers
							chatId={chatId}
							mcpServerIds={mcpServerIds}
							onUpdate={handleMCPServersUpdate}
						/>
					</div>
				</div>

				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={updateChatMutation.isPending}>
						Save Changes
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}