import { AvailableAppsSection } from "@/components/AvailableAppsSection";
import { CTASection } from "@/components/CTASection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { SocialProofSection } from "@/components/SocialProofSection";
import { ThemeProvider } from "@/components/theme-provider";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		// force dark mode for landing page
		<ThemeProvider
			attribute="class"
			forcedTheme="dark"
			storageKey="remote-mcp-theme"
			enableColorScheme
		>
			<div className="min-h-screen bg-black text-white">
				<HeroSection />
				<FeaturesSection />
				<AvailableAppsSection />
				<HowItWorksSection />
				<SocialProofSection />
				<CTASection />
			</div>
		</ThemeProvider>
	);
}
