import { MdiGithub } from "@/app/mcp/apps/icons";
import { motion } from "framer-motion";

export function SocialProofSection() {
	return (
		<section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
			<div className="max-w-7xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.6 }}
					viewport={{ once: true }}
					className="text-center mt-16"
				>
					<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 max-w-2xl mx-auto">
						<MdiGithub className="h-12 w-12 text-white mx-auto mb-4" />
						<h3 className="text-2xl font-bold text-white mb-4">
							Open Source & Transparent
						</h3>
						<p className="text-gray-400 mb-6">
							Built by the community, for the community. Check out our GitHub
							repository and contribute to the future of AI tool integration.
						</p>
						<a
							href="https://github.com/YaSh8202/remote-mcp"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center space-x-2 bg-white text-black hover:bg-gray-200 font-semibold px-6 py-3 rounded-lg transition-colors"
						>
							<MdiGithub className="h-6 w-6" />
							<span>View on GitHub</span>
						</a>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
