import { AppSidebar } from "@/components/app-sidebar";
import HeaderBreadcrumb from "@/components/header-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import {
	Outlet,
	createFileRoute,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { Suspense, useEffect } from "react";

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
	errorComponent: ({ error, reset }) => {
		const router = useRouter();
		const queryErrorResetBoundary = useQueryErrorResetBoundary();

		useEffect(() => {
			// Reset the query error boundary
			queryErrorResetBoundary.reset();
		}, [queryErrorResetBoundary]);

		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center max-w-lg mx-auto p-8 space-y-8">
				<div className="space-y-4 text-center">
					<div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
						<svg
							className="w-8 h-8 text-destructive"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<div className="space-y-2">
						<h2 className="text-2xl font-semibold text-foreground">Something went wrong</h2>
						<p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
					</div>
				</div>
				<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
					<Button 
						variant="outline" 
						onClick={() => reset()}
						className="min-w-[120px]"
					>
						Try again
					</Button>
					<Button 
						onClick={() => {
							reset();
							router.invalidate();
						}}
						className="min-w-[120px]"
					>
						Reload page
					</Button>
					<Button 
						variant="secondary"
						onClick={() => router.navigate({ to: "/" })}
						className="min-w-[120px]"
					>
						Go to Home
					</Button>
				</div>
			</div>
		);
	},
});
