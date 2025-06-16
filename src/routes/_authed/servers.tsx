import { Button } from "@/components/ui/button";
import { useTRPC } from "@/integrations/trpc/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/servers")({
	component: RouteComponent,
	async loader({ context }) {
		return await context.queryClient.prefetchQuery(
			context.trpc.mcpServer.list.queryOptions(),
		);
	},
});

function RouteComponent() {
	const trpc = useTRPC();
	const { data: servers } = useQuery(trpc.mcpServer.list.queryOptions());
	const navigate = useNavigate();

	const addServerMutation = useMutation({
		...trpc.mcpServer.create.mutationOptions(),
		onSuccess: (data) => {
			navigate({
				to: `/servers/${data.id}`,
			});
		},
	});

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Servers</h1>
			<Button
				onClick={() =>
					addServerMutation.mutate({
						name: "Untitled",
					})
				}
			>
				Add Server
			</Button>
			<p>{JSON.stringify(servers, null, 2)}</p>
		</div>
	);
}
