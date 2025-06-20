import {
	createFileRoute,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/redirect")({
	component: RouteComponent,
});

function RouteComponent() {
	const location = useLocation();
	const navigate = useNavigate();
	const hasCheckedParams = useRef(false);
	useEffect(() => {
		if (hasCheckedParams.current) {
			return;
		}
		const params = new URLSearchParams(location.search);
		const code = params.get("code");
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
	}, [location.search, navigate]);

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
