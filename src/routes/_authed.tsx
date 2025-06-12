import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
	beforeLoad: ({ context }) => {
		if (!context.userSession?.user) {
			throw redirect({ to: "/login", statusCode: 302 });
		}
	},
	component: () => (
		<SidebarProvider>
			<AppSidebar />
			<main className="w-full">
        <Outlet />
      </main>
		</SidebarProvider>
	),
});
