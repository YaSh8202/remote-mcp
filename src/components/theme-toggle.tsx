import { Moon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Switch } from "@/components/ui/switch";
import { getSystemTheme, useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { DropdownMenuItem } from "./ui/dropdown-menu";

export const ThemeToggle = () => {
	const { setTheme, theme } = useTheme();

	const isDarkMode =
		theme === "system" ? getSystemTheme() === "dark" : theme === "dark";

	const handleToggleTheme = () => {
		setTheme(isDarkMode ? "light" : "dark");
	};

	return (
		<DropdownMenuItem className="p-0" onSelect={(e) => e.preventDefault()}>
			<Button
				asChild
				variant="ghost"
				size="sm"
				className={cn("gap-x-2 w-full justify-between px-2")}
				onClick={handleToggleTheme}
			>
				<div>
					<div className="flex items-center gap-2">
						<Moon className="h-4 w-4" />
						<span>Dark Mode</span>
					</div>
					<Switch checked={isDarkMode} />
				</div>
			</Button>
		</DropdownMenuItem>
	);
};
