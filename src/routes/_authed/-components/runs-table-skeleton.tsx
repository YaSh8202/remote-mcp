import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export function RunsTableSkeleton() {
	return (
		<div className="space-y-4">
			{/* Search skeleton */}
			<div className="flex items-center justify-between">
				<div className="flex flex-1 items-center space-x-2">
					<Skeleton className="h-8 w-[150px] lg:w-[250px]" />
				</div>
			</div>

			{/* Table skeleton */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[120px]">
								<Skeleton className="h-4 w-16" />
							</TableHead>
							<TableHead className="w-[140px]">
								<Skeleton className="h-4 w-12" />
							</TableHead>
							<TableHead className="w-[120px]">
								<Skeleton className="h-4 w-12" />
							</TableHead>
							<TableHead className="w-[100px]">
								<Skeleton className="h-4 w-14" />
							</TableHead>
							<TableHead className="w-[120px]">
								<Skeleton className="h-4 w-16" />
							</TableHead>
							<TableHead className="w-[100px]">
								<Skeleton className="h-4 w-16" />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{Array.from({ length: 8 }).map((_, index) => (
							<TableRow key={index}>
								<TableCell>
									<Skeleton className="h-4 w-24" />
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Skeleton className="h-5 w-5 rounded" />
										<Skeleton className="h-4 w-16" />
									</div>
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-20" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-6 w-16 rounded-full" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-16" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-8 w-16" />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Pagination skeleton */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-32" />
				<div className="flex items-center space-x-2">
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
				</div>
			</div>
		</div>
	);
}
