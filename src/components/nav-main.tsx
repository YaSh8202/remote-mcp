import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { Activity, Link2, Server, Settings2 } from "lucide-react";

const items = [
	{
		title: "Servers",
		url: "/servers",
		icon: Server,
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
	return (
		<SidebarGroup>
			{/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
			<SidebarMenu>
				{items.map((item) => (
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
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
