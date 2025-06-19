import { appIcons } from "@/app/mcp/apps/icons";
import type { McpAppLogo } from "@/app/mcp/mcp-app";

export const AppLogo = ({
	logo,
	appName = "Application",
	className = "",
}: {
	logo: McpAppLogo;
	appName?: string;
	className?: string;
}) => {
	if (logo.type === "url") {
		return (
			<img
				src={logo.url}
				alt={appName}
				className={className}
				onError={(e) => {
					const target = e.target as HTMLImageElement;
					target.src = "/favicon.ico";
				}}
			/>
		);
	}

	const Icon = appIcons[logo.icon as keyof typeof appIcons];

	if (!Icon) {
		console.warn(
			`No icon found for app: ${appName} with icon type: ${logo.icon}`,
		);
		return null;
	}

	return <Icon className={className} />;
};
