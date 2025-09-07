import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
	ArchiveIcon,
	EditIcon,
	MoreVertical,
	PlusIcon,
	TrashIcon,
} from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

import { ConfirmationDeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/integrations/trpc/react";
import { cn } from "@/lib/utils";

interface Chat {
	id: string;
	title: string | null;
	updatedAt: Date;
	archived: boolean;
}

export const ThreadList: FC = () => {
	const trpc = useTRPC();

	const { data: chats = [], isLoading } = useQuery(
		trpc.chat.list.queryOptions({
			archived: false,
			limit: 50,
			offset: 0,
		}),
	);

	if (isLoading) {
		return (
			<div className="text-foreground flex flex-col items-stretch gap-1.5">
				<ThreadListNew />
				<div className="space-y-1.5">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="flex items-center gap-2 px-2.5 py-2">
							<Skeleton className="h-4 flex-1" />
							<Skeleton className="h-4 w-4" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="text-foreground flex flex-col items-stretch gap-1.5 max-h-[20rem] overflow-auto ">
			<ThreadListNew />
			{chats.length === 0 ? (
				<div className="text-muted-foreground text-sm px-2">No chats yet</div>
			) : (
				chats.map((chat) => <ThreadListItem key={chat.id} chat={chat} />)
			)}
		</div>
	);
};

const ThreadListNew: FC = () => {
	return (
		<Link to="/chat">
			<Button
				className="data-active:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start"
				variant="ghost"
			>
				<PlusIcon />
				New Thread
			</Button>
		</Link>
	);
};

const ThreadListItem: FC<{ chat: Chat }> = ({ chat }) => {
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
	const [newTitle, setNewTitle] = useState(chat.title || "");
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const updateChatMutation = useMutation({
		mutationFn: trpc.chat.update.mutationOptions().mutationFn,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.chat.list.queryKey(),
			});
			setRenameDialogOpen(false);
		},
	});

	const deleteChatMutation = useMutation({
		mutationFn: trpc.chat.delete.mutationOptions().mutationFn,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.chat.list.queryKey(),
			});
		},
	});

	const handleRename = async () => {
		if (!newTitle.trim()) return;
		updateChatMutation.mutate({
			id: chat.id,
			title: newTitle.trim(),
		});
	};

	const handleArchive = async () => {
		await updateChatMutation.mutateAsync({
			id: chat.id,
			archived: true,
		});
	};

	const handleDelete = async () => {
		await deleteChatMutation.mutateAsync({ id: chat.id });
	};

	return (
		<>
			<Link
				to="/chat/$chatId"
				params={{ chatId: chat.id }}
				activeProps={{
					"data-active": true,
				}}
				className="data-active:bg-muted hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2"
			>
				<span className="flex-grow px-3 py-2 text-start min-w-0">
					<p className={cn("text-sm truncate")}>{chat.title || "New Chat"}</p>
				</span>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="hover:text-foreground/60 text-foreground h-8 w-8 p-0"
							onClick={(e) => e.preventDefault()}
						>
							<MoreVertical className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
							<EditIcon className="mr-2 h-4 w-4" />
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setArchiveDialogOpen(true)}>
							<ArchiveIcon className="mr-2 h-4 w-4" />
							Archive
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setDeleteDialogOpen(true)}
							className="text-destructive"
						>
							<TrashIcon className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</Link>

			<Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename Chat</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							placeholder="Enter new chat title"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleRename();
								}
							}}
						/>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setRenameDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={handleRename}
								disabled={updateChatMutation.isPending || !newTitle.trim()}
							>
								{updateChatMutation.isPending ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<ConfirmationDeleteDialog
				title="Archive Chat"
				message={`Are you sure you want to archive "${chat.title || "New Chat"}"? You can find it in your archived chats.`}
				entityName="chat"
				buttonText="Archive"
				mutationFn={handleArchive}
				open={archiveDialogOpen}
				onOpenChange={setArchiveDialogOpen}
				showToast={true}
				isDanger={false}
			/>

			<ConfirmationDeleteDialog
				title="Delete Chat"
				message={`Are you sure you want to delete "${chat.title || "New Chat"}"? This action cannot be undone.`}
				entityName="chat"
				buttonText="Delete"
				mutationFn={handleDelete}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				showToast={true}
				isDanger={true}
			/>
		</>
	);
};
