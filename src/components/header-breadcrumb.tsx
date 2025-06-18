import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useHeaderStore } from "@/store/header-store";

function HeaderBreadcrumb() {
	const { breadcrumbs, actions, title } = useHeaderStore();

	return (
		<div className="flex items-center justify-between w-full">
			<div className="flex items-center gap-2">
				<Breadcrumb>
					<BreadcrumbList>
						{breadcrumbs.map((item, index) => (
							<BreadcrumbItem key={`${item.label}-${index}`}>
								{item.href ? (
									<BreadcrumbLink href={item.href}>
										{item.label}
									</BreadcrumbLink>
								) : (
									<BreadcrumbPage>{item.label}</BreadcrumbPage>
								)}
								{index < breadcrumbs.length - 1 && (
									<BreadcrumbSeparator className="hidden md:block" />
								)}
							</BreadcrumbItem>
						))}
					</BreadcrumbList>
				</Breadcrumb>
				{title && (
					<>
						<BreadcrumbSeparator className="hidden md:block" />
						<h1 className="text-lg font-semibold">{title}</h1>
					</>
				)}
			</div>
			
			{actions.length > 0 && (
				<div className="flex items-center gap-2">
					{actions.map((action) => (
						<Button
							key={action.id}
							variant={action.variant || "default"}
							size="sm"
							onClick={action.onClick}
							disabled={action.disabled}
						>
							{action.icon && <span className="mr-2">{action.icon}</span>}
							{action.label}
						</Button>
					))}
				</div>
			)}
		</div>
	);
}

export default HeaderBreadcrumb;
