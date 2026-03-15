import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, Github, Tag } from "lucide-react";
import { Button } from "../ui/button";

const features = [
	"159+ tools across 13 integrations",
	"Self-hostable — deploy anywhere",
	"Built-in AI chat with 7+ LLM providers",
	"Tool execution audit logs",
	"No usage limits, no seat pricing",
];

export function PricingSection() {
	return (
		<section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950">
			<div className="max-w-4xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					viewport={{ once: true }}
					className="text-center mb-12"
				>
					<div className="inline-flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-full px-6 py-2 mb-8">
						<Tag className="h-4 w-4 text-green-400" />
						<span className="text-gray-300 text-sm">
							MIT License · Free Forever
						</span>
					</div>

					<h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
						Simple, Transparent{" "}
						<span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
							Pricing
						</span>
					</h2>

					<p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
						No seats. No usage tiers. No hidden fees. Remote MCP is free and
						open source under the MIT license — forever.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					viewport={{ once: true }}
				>
					<div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl p-8 md:p-12 overflow-hidden">
						{/* Subtle glow accent */}
						<div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
						<div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

						<div className="relative z-10">
							{/* Card header */}
							<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
								<div>
									<span className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold uppercase tracking-wider rounded-full px-3 py-1 mb-3">
										Free &amp; Open Source
									</span>
									<h3 className="text-2xl md:text-3xl font-bold text-white">
										Everything included
									</h3>
									<p className="text-gray-400 mt-1 text-sm">
										MIT License — use it, fork it, self-host it.
									</p>
								</div>
								<div className="text-left sm:text-right shrink-0">
									<div className="text-4xl md:text-5xl font-bold text-white">
										$0
									</div>
									<div className="text-gray-500 text-sm">/ forever</div>
								</div>
							</div>

							{/* Divider */}
							<div className="border-t border-neutral-800 mb-8" />

							{/* Feature list */}
							<ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
								{features.map((feature) => (
									<li key={feature} className="flex items-start gap-3">
										<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 border border-green-500/30">
											<Check className="h-3 w-3 text-green-400" />
										</span>
										<span className="text-gray-300 text-sm leading-relaxed">
											{feature}
										</span>
									</li>
								))}
							</ul>

							{/* CTAs */}
							<div className="flex flex-col sm:flex-row gap-3">
								<a
									href="https://github.com/YaSh8202/remote-mcp"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Button
										size="lg"
										variant="outline"
										className="w-full sm:w-auto border-neutral-700 text-white bg-neutral-800 hover:bg-neutral-700 font-semibold px-8 py-3"
									>
										<Github className="mr-2 h-5 w-5" />
										Star on GitHub
									</Button>
								</a>
								<Link to="/login">
									<Button
										size="lg"
										className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3"
									>
										Get Started Free
										<ArrowRight className="ml-2 h-5 w-5" />
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Open source tagline */}
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					transition={{ duration: 0.8, delay: 0.4 }}
					viewport={{ once: true }}
					className="text-center text-gray-500 text-sm mt-8"
				>
					Fork it. Self-host it. Contribute back.{" "}
					<a
						href="https://github.com/YaSh8202/remote-mcp"
						target="_blank"
						rel="noopener noreferrer"
						className="text-gray-400 underline underline-offset-2 hover:text-white transition-colors"
					>
						View the source on GitHub →
					</a>
				</motion.p>
			</div>
		</section>
	);
}
