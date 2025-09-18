import { useTRPC } from "@/integrations/trpc/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { BackgroundBeams } from "./ui/background-beams";
import { Button } from "./ui/button";
import { TextGenerateEffect } from "./ui/text-generate-effect";

export function HeroSection() {
	const trpc = useTRPC();
	const { data: apps } = useSuspenseQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);

	const toolsCount = apps
		.map((app) => app.tools.length)
		.reduce((a, b) => a + b, 0);

	const words = "Connect your AI agents to the real world with Remote MCP";

	return (
		<div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
			<BackgroundBeams />

			<div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				{/* Logo */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className="mb-8"
				>
					<img
						src="/logo192.png"
						alt="Remote MCP"
						className="h-16 w-16 mx-auto"
					/>
				</motion.div>

				{/* Main Headline */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1, delay: 0.2 }}
					className="mb-6"
				>
					<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
						<TextGenerateEffect words={words} />
					</h1>
				</motion.div>

				{/* Subheadline */}
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 1 }}
					className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
				>
					Create and manage MCP servers in the cloud. No complex setup required.
					Connect to GitHub, Slack, YouTube, PostgreSQL, and {toolsCount}+ tools
					across&nbsp;
					{apps?.length || 0} integrated applications.
				</motion.p>

				{/* Stats */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 1.2 }}
					className="flex justify-center space-x-8 mb-12 text-gray-300"
				>
					<div className="text-center">
						<div className="text-2xl font-bold text-white">{toolsCount}+</div>
						<div className="text-sm">Tools Available</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-white">
							{apps?.length || 0}
						</div>
						<div className="text-sm">Apps Integrated</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-white">0</div>
						<div className="text-sm">Setup Required</div>
					</div>
				</motion.div>

				{/* CTAs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 1.4 }}
					className="flex flex-col sm:flex-row gap-4 justify-center"
				>
					<Link to="/login">
						<Button
							size="lg"
							className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3 text-lg"
						>
							Get Started Free
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</Link>
					<Button
						variant="outline"
						size="lg"
						className="border-gray-600 text-white hover:bg-gray-800 font-semibold px-8 py-3 text-lg"
					>
						<Play className="mr-2 h-5 w-5" />
						Watch Demo
					</Button>
				</motion.div>

				{/* Trusted by */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.8, delay: 1.6 }}
					className="text-gray-500 text-sm mt-12"
				>
					Built for AI agents • Trusted by developers worldwide
				</motion.p>
			</div>
		</div>
	);
}
