import { Link } from "@tanstack/react-router";
import { RemoteMcpLogo } from "./icons";
import { Button } from "./ui/button";

export function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="text-center space-y-6 max-w-md">
				<RemoteMcpLogo className="w-24 h-24 mx-auto text-muted-foreground" />
				<h1 className="text-6xl font-bold text-foreground">404</h1>
				<h2 className="text-2xl font-semibold text-foreground">
					Page Not Found
				</h2>
				<p className="text-muted-foreground">
					The page you're looking for doesn't exist or has been moved.
				</p>
				<div className="flex gap-4 justify-center pt-4">
					<Button asChild>
						<Link to="/">Go to Home</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/servers">View Servers</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
