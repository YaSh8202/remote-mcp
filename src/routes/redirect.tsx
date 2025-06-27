import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";

export const Route = createFileRoute("/redirect")({
	component: RouteComponent,
	validateSearch: z.object({
		code: z.string().optional(),
	}),
});

function RouteComponent() {
	const navigate = useNavigate();
	const hasCheckedParams = useRef(false);
	const params = useSearch({ strict: false });
	useEffect(() => {
		if (hasCheckedParams.current) {
			return;
		}
		const code = params.code;
		if (window.opener && code) {
			window.opener.postMessage(
				{
					code: code,
				},
				"*",
			);
		}
		if (!window.opener && !code) {
			navigate({ to: "/" });
		}
	}, [navigate, params.code]);

	return (
		<div className="flex flex-col items-center justify-center gap-4">
			<div className="text-center">
				<h1 className="text-3xl font-bold">The redirection works!</h1>
				<p className="text-muted-foreground">
					You will be redirected in a few seconds.
				</p>
			</div>
		</div>
	);
}
