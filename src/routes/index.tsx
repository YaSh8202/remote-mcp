import { FeaturesSection } from "@/components/FeaturesSection";
import { AvailableAppsSection } from "@/components/landing/AvailableAppsSection";
import { CTASection } from "@/components/landing/CTASection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { ThemeProvider } from "@/components/theme-provider";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { createFileRoute } from "@tanstack/react-router";
import { Home, Layers, Mail, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const navItems = [
		{
			name: "Home",
			link: "#home",
			icon: <Home className="h-4 w-4 text-neutral-500 dark:text-white" />,
		},
		{
			name: "Features",
			link: "#features",
			icon: <Zap className="h-4 w-4 text-neutral-500 dark:text-white" />,
		},
		{
			name: "Apps",
			link: "#apps",
			icon: <Layers className="h-4 w-4 text-neutral-500 dark:text-white" />,
		},
		{
			name: "How it Works",
			link: "#how-it-works",
			icon: <Users className="h-4 w-4 text-neutral-500 dark:text-white" />,
		},
		{
			name: "Contact",
			link: "#contact",
			icon: <Mail className="h-4 w-4 text-neutral-500 dark:text-white" />,
		},
	];

	return (
		// force dark mode for landing page
		<ThemeProvider
			attribute="class"
			forcedTheme="dark"
			storageKey="remote-mcp-theme"
			enableColorScheme
		>
			<div className="min-h-screen bg-black text-white">
				<FloatingNav navItems={navItems} />
				<div id="home">
					<HeroSection />
				</div>
				<div id="features">
					<FeaturesSection />
				</div>
				<div id="apps">
					<AvailableAppsSection />
				</div>
				<div id="how-it-works">
					<HowItWorksSection />
				</div>
				<div id="contact">
					<SocialProofSection />
					<CTASection />
				</div>
			</div>
		</ThemeProvider>
	);
}
