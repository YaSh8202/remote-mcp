import { AppSidebar } from "@/components/app-sidebar";
import HeaderBreadcrumb from "@/components/header-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_authed")({
	beforeLoad: ({ context }) => {
		if (!context.userSession?.user) {
			throw redirect({ to: "/login", statusCode: 302 });
		}
	},
	component: () => (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="mr-2 data-[orientation=vertical]:h-4"
					/>
					<HeaderBreadcrumb />
				</header>
				<div className="flex flex-1 flex-col p-4">
					<Suspense
						fallback={
							<div className="space-y-6">
								<div className="space-y-2">
									<Skeleton className="h-8 w-48" />
									<Skeleton className="h-4 w-64" />
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<Skeleton className="h-32 w-full" />
									<Skeleton className="h-32 w-full" />
									<Skeleton className="h-32 w-full" />
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									<Skeleton className="h-48 w-full" />
									<Skeleton className="h-48 w-full" />
									<Skeleton className="h-48 w-full" />
								</div>
							</div>
						}
					>
						<Outlet />
					</Suspense>
				</div>
			</SidebarInset>
		</SidebarProvider>
	),
});
