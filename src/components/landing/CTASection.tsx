import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { BackgroundBeams } from "../ui/background-beams";
import { Button } from "../ui/button";

export function CTASection() {
	return (
		<section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
			<BackgroundBeams className="opacity-30" />

			<div className="relative z-10 max-w-4xl mx-auto text-center">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					viewport={{ once: true }}
					className="mb-8"
				>
					<div className="inline-flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-full px-6 py-2 mb-8">
						<Sparkles className="h-4 w-4 text-yellow-500" />
						<span className="text-gray-300 text-sm">
							Ready to supercharge your AI agents?
						</span>
					</div>

					<h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
						Start Building the Future
						<br />
						<span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
							of AI Today
						</span>
					</h2>

					<p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
						Join thousands of developers who are already building incredible AI
						applications with Remote MCP. Get started in minutes, scale to
						millions.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					viewport={{ once: true }}
					className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
				>
					<Link to="/login">
						<Button
							size="lg"
							className="bg-white text-black hover:bg-gray-200 font-semibold px-12 py-4 text-lg"
						>
							Start Free Today
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</Link>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.4 }}
					viewport={{ once: true }}
					className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
				>
					<div>
						<div className="text-3xl font-bold text-white mb-2">⚡</div>
						<div className="text-gray-300">Setup in minutes</div>
					</div>
					<div>
						<div className="text-3xl font-bold text-white mb-2">🔒</div>
						<div className="text-gray-300">Enterprise-grade security</div>
					</div>
					<div>
						<div className="text-3xl font-bold text-white mb-2">🚀</div>
						<div className="text-gray-300">Scale infinitely</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
