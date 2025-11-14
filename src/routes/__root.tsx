import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import TanStackQueryLayout from "../integrations/tanstack-query/layout.tsx";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import { I18nProvider } from "@/components/i18n-provider.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { TRPCRouter } from "@/integrations/trpc/router";
import { authQueries } from "@/services/queries";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

interface MyRouterContext {
	queryClient: QueryClient;
	trpc: TRPCOptionsProxy<TRPCRouter>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async ({ context }) => {
		const userSession = await context.queryClient.fetchQuery(
			authQueries.user(),
		);

		return { userSession };
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
				title: "Remote MCP - Cloud MCP Servers for AI Assistants",
			},
			{
				name: "description",
				content:
					"Connect AI assistants like Claude and Cursor to your favorite apps. Create and manage MCP servers in the cloud with 159+ tools across GitHub, Slack, YouTube, PostgreSQL, and more.",
			},
			{
				name: "robots",
				content: "index, follow",
			},
			{
				name: "theme-color",
				content: "#000000",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/favicon.ico",
			},
			{
				rel: "canonical",
				href: "https://remotemcp.tech",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument() {
	return (
		<html suppressHydrationWarning lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<I18nProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						storageKey="remote-mcp-theme"
						enableColorScheme
					>
						<TooltipProvider>
							<Outlet />
							<TanStackRouterDevtools />
							<TanStackQueryLayout />
						</TooltipProvider>
					</ThemeProvider>
				</I18nProvider>
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
