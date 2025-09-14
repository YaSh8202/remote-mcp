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
				title: "Remote Mcp",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
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
						storageKey="mcp-one-theme"
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
