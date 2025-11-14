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
	head: () => {
		const title = "Remote MCP - Connect AI Assistants to Your Favorite Apps";
		const description =
			"Create and manage MCP servers in the cloud. Connect Claude, Cursor, and other AI clients to GitHub, Slack, YouTube, PostgreSQL, and 159+ tools across 11 integrated apps. No complex setup required.";
		const imageUrl = "https://remotemcp.tech/logo512.png";
		const siteUrl = "https://remotemcp.tech";

		return {
			meta: [
				{
					title,
				},
				{
					name: "description",
					content: description,
				},
				// Open Graph meta tags
				{
					property: "og:title",
					content: title,
				},
				{
					property: "og:description",
					content: description,
				},
				{
					property: "og:type",
					content: "website",
				},
				{
					property: "og:image",
					content: imageUrl,
				},
				{
					property: "og:url",
					content: siteUrl,
				},
				{
					property: "og:site_name",
					content: "Remote MCP",
				},
				// Twitter Card meta tags
				{
					name: "twitter:card",
					content: "summary_large_image",
				},
				{
					name: "twitter:title",
					content: title,
				},
				{
					name: "twitter:description",
					content: description,
				},
				{
					name: "twitter:image",
					content: imageUrl,
				},
				// Additional SEO meta tags
				{
					name: "keywords",
					content:
						"MCP, Model Context Protocol, AI assistant, Claude Desktop, Cursor, GitHub integration, Slack integration, AI tools, cloud MCP server, AI automation",
				},
				{
					name: "author",
					content: "Remote MCP",
				},
				{
					name: "robots",
					content: "index, follow",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
			],
			links: [
				// Preload critical assets
				{
					rel: "preload",
					href: "/logo512.png",
					as: "image",
				},
				// Preconnect to external domains
				{
					rel: "preconnect",
					href: "https://github.com",
				},
			],
		};
	},
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
