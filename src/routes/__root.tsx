import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import TanStackQueryLayout from "../integrations/tanstack-query/layout.tsx";

import { getUserSession } from "../lib/auth-server";
import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import { AppSidebar } from "@/components/app-sidebar.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { SidebarProvider } from "@/components/ui/sidebar.tsx";
import type { TRPCRouter } from "@/integrations/trpc/router";
import { redirect } from "@tanstack/react-router";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

interface MyRouterContext {
	queryClient: QueryClient;
	trpc: TRPCOptionsProxy<TRPCRouter>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	loader: async (ctx) => {
		const session = await getUserSession();
		const isAuthenticated = !!session?.user;
		const isLoginPage = ctx.location.pathname === "/login";
		if (!isAuthenticated && !isLoginPage) {
			// Redirect to login if not authenticated and not already on the login page
			throw redirect({ to: "/login", statusCode: 302 });
		}
		if (isAuthenticated && isLoginPage) {
			// Redirect to home if already authenticated and trying to access login page
			throw redirect({ to: "/", replace: true });
		}

		return {
			session,
		};
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "MCP One",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	component: () => (
		<RootDocument>
			<SidebarProvider>
				<AppSidebar />
				<main className="w-full">
					<Outlet />
				</main>
			</SidebarProvider>

			<TanStackRouterDevtools />

			<TanStackQueryLayout />
		</RootDocument>
	),
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html suppressHydrationWarning lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					storageKey="mcp-one-theme"
					enableColorScheme
				>
					{children}
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}
