import { Link, useRouterState } from "@tanstack/react-router";
import {
	Activity,
	AppWindow,
	ChevronRight,
	Link2,
	MessageSquare,
	Server,
	Settings2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
} from "@/components/ui/sidebar";
import { ThreadList } from "./assistant-ui/thread-list";

const items = [
	{
		title: "Chat",
		url: "/chat",
		icon: MessageSquare,
	},
	{
		title: "Servers",
		url: "/servers",
		icon: Server,
	},
	{
		title: "Apps",
		url: "/apps",
		icon: AppWindow,
	},
	{
		title: "Runs",
		url: "/runs",
		icon: Activity,
	},

	{
		title: "Connections",
		url: "/connections",
		icon: Link2,
	},
	{
		title: "Settings",
		url: "/settings",
		icon: Settings2,
	},
] as const;

export function NavMain() {
	const router = useRouterState();
	const isOnChatPage = router.location.pathname.startsWith("/chat");
	const [isChatExpanded, setIsChatExpanded] = useState(isOnChatPage);

	// Update expanded state when route changes
	useEffect(() => {
		setIsChatExpanded(isOnChatPage);
	}, [isOnChatPage]);

	return (
		<SidebarGroup>
			{/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
			<SidebarMenu>
				{items.map((item) => {
					if (item.title === "Chat") {
						return (
							<Collapsible
								key={item.title}
								open={isChatExpanded}
								onOpenChange={setIsChatExpanded}
							>
								<SidebarMenuItem className="text-base">
									<CollapsibleTrigger asChild>
										<Link activeOptions={{ exact: false }} to={item.url}>
											{({ isActive }) => (
												<SidebarMenuButton
													isActive={isActive}
													className="w-full"
													tooltip={item.title}
												>
													{item.icon && <item.icon />}
													<span>{item.title}</span>
													{isOnChatPage && (
														<ChevronRight
															className={`ml-auto h-4 w-4 transition-transform ${
																isChatExpanded ? "rotate-90" : ""
															}`}
														/>
													)}
												</SidebarMenuButton>
											)}
										</Link>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											<div className="px-2 py-2">
												<ThreadList />
											</div>
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
						);
					}

					return (
						<SidebarMenuItem className="text-base" key={item.title}>
							<Link activeOptions={{ exact: false }} to={item.url}>
								{({ isActive }) => (
									<SidebarMenuButton
										isActive={isActive}
										className=""
										tooltip={item.title}
									>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
									</SidebarMenuButton>
								)}
							</Link>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
