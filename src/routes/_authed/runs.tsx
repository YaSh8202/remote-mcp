import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { runsSearchSchema } from "@/hooks/use-runs-table";
import { useTRPC } from "@/integrations/trpc/react";
import { usePageHeader } from "@/store/header-store";
import { RunsTable } from "./-components/runs-table";

export const Route = createFileRoute("/_authed/runs")({
	component: RunsPage,
	validateSearch: runsSearchSchema,
});

function RunsPage() {
	const queryClient = useQueryClient();
	const trpc = useTRPC();

	// Configure page header
	usePageHeader({
		breadcrumbs: [{ label: "Runs" }],
		actions: [
			{
				id: "refresh",
				label: "Refresh",
				icon: <Activity className="h-4 w-4" />,
				onClick: () => {
					// Invalidate all queries related to runs and refresh data
					queryClient.invalidateQueries({
						queryKey: trpc.mcpRun.list.queryKey(),
					});
				},
				variant: "outline" as const,
			},
		],
	});

	return (
		<div className="w-full max-w-full mx-auto p-4 md:p-6 space-y-6">
			<RunsTable />
		</div>
	);
}
