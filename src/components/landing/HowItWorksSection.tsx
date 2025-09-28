import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Settings, Zap } from "lucide-react";
import { Button } from "../ui/button";

export function HowItWorksSection() {
	const steps = [
		{
			number: "1",
			title: "Create Your MCP Server",
			description:
				"Visit remotemcp.tech, sign up with Google or GitHub, and click 'Add Server' to create your first MCP server.",
			icon: <Plus className="h-8 w-8" />,
			color: "from-blue-500 to-purple-600",
		},
		{
			number: "2",
			title: "Configure App Connections",
			description:
				"Go to the 'Connections' tab, click 'New Connection', select your app and authenticate. Your credentials are securely stored and encrypted.",
			icon: <Settings className="h-8 w-8" />,
			color: "from-purple-500 to-pink-600",
		},
		{
			number: "3",
			title: "Connect to Your AI Client",
			description:
				"Add your Remote MCP server to VS Code, Cursor, Claude Desktop, or any MCP-compatible application with one click.",
			icon: <Zap className="h-8 w-8" />,
			color: "from-pink-500 to-red-600",
		},
	];

	const useCases = [
		"Create a GitHub issue for the bug I found",
		"Send a message to the #general Slack channel",
		"Create a new page in my Notion workspace",
		"Query our PostgreSQL database for user metrics",
		"Search for recent videos about AI on YouTube",
		"Play my favorite playlist on Spotify",
	];

	return (
		<section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950">
			<div className="max-w-7xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
						How It Works
					</h2>
					<p className="text-xl text-gray-400 max-w-3xl mx-auto">
						Get your AI agents connected to external tools in just three simple
						steps.
					</p>
				</motion.div>

				{/* Steps */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
					{steps.map((step, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: index * 0.2 }}
							viewport={{ once: true }}
							className="relative group"
						>
							{/* Connector line */}
							{index < steps.length - 1 && (
								<div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gray-600 to-gray-800 z-0" />
							)}

							<div className="relative z-10 bg-neutral-900 border border-neutral-800 rounded-xl p-8 hover:border-neutral-700 transition-all duration-300 group-hover:scale-105">
								{/* Step number and icon */}
								<div className="flex items-center justify-between mb-6">
									<div
										className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-lg`}
									>
										{step.number}
									</div>
									<div className="text-gray-400 group-hover:text-white transition-colors">
										{step.icon}
									</div>
								</div>

								<h3 className="text-xl font-semibold text-white mb-4">
									{step.title}
								</h3>
								<p className="text-gray-400 leading-relaxed">
									{step.description}
								</p>
							</div>
						</motion.div>
					))}
				</div>

				{/* Use Cases */}
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.6 }}
					viewport={{ once: true }}
					className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 md:p-12"
				>
					<div className="text-center mb-8">
						<h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
							Start Using Right Away
						</h3>
						<p className="text-gray-400 text-lg">
							Once connected, your AI assistant can interact with your apps. Try
							asking:
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
						{useCases.map((useCase, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
								viewport={{ once: true }}
								className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:border-neutral-600 transition-all duration-300"
							>
								<div className="flex items-start space-x-3">
									<div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
									<p className="text-gray-300 font-mono text-sm">"{useCase}"</p>
								</div>
							</motion.div>
						))}
					</div>

					<div className="text-center">
						<Link to="/chat">
							<Button
								size="lg"
								className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3"
							>
								Get Started Now
								<ArrowRight className="ml-2 h-5 w-5" />
							</Button>
						</Link>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
