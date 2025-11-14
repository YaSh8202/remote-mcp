import { MoreHorizontal } from "lucide-react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHeaderStore } from "@/store/header-store";

function HeaderBreadcrumb() {
	const { breadcrumbs, actions, title } = useHeaderStore();

	return (
		<div className="flex w-full h-full items-center justify-between gap-2 min-w-0">
			<div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
				<Breadcrumb>
					<BreadcrumbList>
						{breadcrumbs.map((item, index) => (
							<BreadcrumbItem key={`${item.label}-${index}`}>
								{item.href ? (
									<BreadcrumbLink
										href={item.href}
										className="max-w-[120px] sm:max-w-[150px] truncate"
									>
										{item.label}
									</BreadcrumbLink>
								) : (
									<BreadcrumbPage className="max-w-[120px] sm:max-w-[150px] truncate">
										{item.label}
									</BreadcrumbPage>
								)}
								{index < breadcrumbs.length - 1 && (
									<BreadcrumbSeparator className="hidden sm:block" />
								)}
							</BreadcrumbItem>
						))}
					</BreadcrumbList>
				</Breadcrumb>
				{title && (
					<>
						<BreadcrumbSeparator className="hidden sm:block" />
						{typeof title === "string" ? (
							<h1
								className="truncate text-base font-semibold md:text-lg max-w-[150px] sm:max-w-[200px] md:max-w-none"
								title={title}
							>
								{title}
							</h1>
						) : (
							<div className="flex min-w-0 items-center max-w-[150px] sm:max-w-[200px] md:max-w-none overflow-hidden">
								{title}
							</div>
						)}
					</>
				)}
			</div>

			{actions.length > 0 && (
				<div className="flex items-center gap-1 sm:gap-2 shrink-0">
					{/* Desktop actions */}
					<div className="hidden sm:flex items-center gap-2">
						{actions.map((action) => (
							<Button
								key={action.id}
								variant={action.variant || "default"}
								size="sm"
								onClick={action.onClick}
								disabled={action.disabled}
								className="h-8"
							>
								{action.icon && (
									<span className="mr-1 sm:mr-2">{action.icon}</span>
								)}
								<span className="hidden md:inline text-sm">{action.label}</span>
								<span className="md:hidden sr-only">{action.label}</span>
							</Button>
						))}
					</div>
					{/* Mobile overflow menu */}
					<div className="sm:hidden">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="h-8 w-8"
									aria-label="Open actions"
								>
									<MoreHorizontal className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{actions.map((action) => (
									<DropdownMenuItem
										key={action.id}
										disabled={action.disabled}
										onClick={action.onClick}
										className="cursor-pointer"
									>
										{action.icon && <span className="mr-2">{action.icon}</span>}
										{action.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			)}
		</div>
	);
}

export default HeaderBreadcrumb;
