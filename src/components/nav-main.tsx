import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import {
	Activity,
	BookOpen,
	Bot,
	Settings2,
	SquareTerminal,
} from "lucide-react";

const items = [
	{
		title: "Servers",
		url: "/servers",
		icon: SquareTerminal,
	},
	{
		title: "Runs",
		url: "/runs",
		icon: Activity,
	},
	{
		title: "Apps",
		url: "/",
		icon: Bot,
	},
	{
		title: "Connections",
		url: "/",
		icon: BookOpen,
	},
	{
		title: "Settings",
		url: "/",
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
