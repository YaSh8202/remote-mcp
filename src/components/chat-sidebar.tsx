import { Link, useRouter } from "@tanstack/react-router";
import { ArchiveIcon, MessageSquare, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Chat {
	id: string;
	title: string;
	updatedAt: string;
}

interface ChatSidebarProps {
	currentChatId?: string;
	className?: string;
}

export function ChatSidebar({ currentChatId, className }: ChatSidebarProps) {
	const router = useRouter();
	const [isCreating, setIsCreating] = useState(false);
	const [chats, setChats] = useState<Chat[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchChats = async () => {
		try {
			const response = await fetch("/api/chats");
			if (response.ok) {
				const data = await response.json();
				setChats(data.chats || []);
			}
		} catch (error) {
			console.error("Failed to fetch chats:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchChats();
	}, []);

	const handleNewChat = () => {
		alert("Button clicked!");
		console.log("Button clicked!");
	};

	const handleArchiveChat = async (chatId: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		// TODO: Implement archive functionality
		console.log("Archive chat:", chatId);
	};

	const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
			// TODO: Implement delete functionality
			console.log("Delete chat:", chatId);
		}
	};

	return (
		<div className={cn("w-80 border-r bg-muted/30 flex flex-col", className)}>
			<div className="p-4 border-b">
				<h2 className="text-lg font-semibold mb-4">Conversations</h2>
				<Button
					onClick={handleNewChat}
					disabled={isCreating}
					className="w-full justify-start gap-2"
					variant="outline"
				>
					<PlusIcon className="h-4 w-4" />
					{isCreating ? "Creating..." : "New Chat"}
				</Button>
			</div>

			<ScrollArea className="flex-1">
				<div className="p-2 space-y-1">
					{chats.map((chat) => (
						<div
							key={chat.id}
							className={cn(
								"group relative flex items-center gap-2 rounded-lg p-2 hover:bg-muted transition-colors",
								currentChatId === chat.id && "bg-muted"
							)}
						>
							<Link
								to="/chat/$id"
								params={{ id: chat.id }}
								className="flex-1 flex items-center gap-2 min-w-0"
							>
								<MessageSquare className="h-4 w-4 flex-shrink-0" />
								<span className="text-sm truncate">{chat.title}</span>
							</Link>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
									>
										<span className="sr-only">Chat options</span>
										<svg
											className="h-3 w-3"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
											/>
										</svg>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={(e) => handleArchiveChat(chat.id, e)}
										disabled={archiveChatMutation.isPending}
									>
										<ArchiveIcon className="h-4 w-4 mr-2" />
										Archive
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={(e) => handleDeleteChat(chat.id, e)}
										disabled={deleteChatMutation.isPending}
										className="text-destructive focus:text-destructive"
									>
										<Trash2Icon className="h-4 w-4 mr-2" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					))}

					{chats.length === 0 && (
						<div className="text-center text-muted-foreground py-8">
							<MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No conversations yet</p>
							<p className="text-xs">Start a new chat to get going</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}