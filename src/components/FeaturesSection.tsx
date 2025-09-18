import { motion } from "framer-motion";
import {
	BarChart3,
	Globe,
	Lock,
	MessageSquare,
	Settings,
	Shield,
	Zap,
} from "lucide-react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";

export function FeaturesSection() {
	const features = [
		{
			title: "Zero Setup Required",
			description:
				"No need to run local servers or manage complex configurations. Just create, configure, and connect!",

			header: (
				<FeatureHeaderWrapper>
					<Zap className="h-8 w-8 text-yellow-500" />
					<div className="text-sm font-medium text-gray-300">Instant Setup</div>
				</FeatureHeaderWrapper>
			),
		},
		{
			title: "Enterprise-Grade Security",
			description:
				"Your credentials are encrypted and managed securely. We handle authentication, API limits, and security.",
			header: (
				<FeatureHeaderWrapper>
					<Shield className="h-8 w-8 text-blue-500" />
					<div className="text-sm font-medium text-gray-300">
						Enterprise Security
					</div>
				</FeatureHeaderWrapper>
			),
		},
		{
			title: "Always Available",
			description:
				"Cloud-hosted servers that work 24/7, accessible from any MCP client worldwide.",
			header: (
				<FeatureHeaderWrapper>
					<Globe className="h-8 w-8 text-green-500" />
					<div className="text-sm font-medium text-gray-300">Global Access</div>
				</FeatureHeaderWrapper>
			),
		},
		{
			title: "Visual Management",
			description:
				"Easy-to-use dashboard to manage your servers, connections, and monitor usage in real-time.",
			header: (
				<FeatureHeaderWrapper>
					<BarChart3 className="h-8 w-8 text-purple-500" />
					<div className="text-sm font-medium text-gray-300">
						Visual Dashboard
					</div>
				</FeatureHeaderWrapper>
			),
		},
		{
			title: "Secure Authentication",
			description:
				"Built-in OAuth2 support for all major platforms. Your tokens are encrypted and securely stored.",
			header: (
				<FeatureHeaderWrapper>
					<Lock className="h-8 w-8 text-red-500" />
					<div className="text-sm font-medium text-gray-300">
						OAuth2 Security
					</div>
				</FeatureHeaderWrapper>
			),
		},
		{
			title: "Easy Configuration",
			description:
				"One-click integration with VS Code, Cursor, Claude Desktop, and any MCP-compatible client.",
			header: (
				<FeatureHeaderWrapper>
					<Settings className="h-8 w-8 text-orange-500" />
					<div className="text-sm font-medium text-gray-300">Easy Config</div>
				</FeatureHeaderWrapper>
			),
		},
		{
			title: "AI Chat Integration",
			description:
				"Built-in AI chat interface to test and interact with your remote MCP servers directly in the web app.",
			header: (
				<FeatureHeaderWrapper>
					<MessageSquare className="h-8 w-8 text-cyan-500" />
					<div className="text-sm font-medium text-gray-300">AI Chat</div>
				</FeatureHeaderWrapper>
			),
		},
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
						Why Choose Remote MCP?
					</h2>
					<p className="text-xl text-gray-400 max-w-3xl mx-auto">
						The most powerful and easy-to-use platform for connecting AI agents
						to external tools and services.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 40 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					viewport={{ once: true }}
				>
					<BentoGrid className="max-w-4xl mx-auto">
						{features.map((item, i) => (
							<BentoGridItem
								key={i}
								title={item.title}
								description={item.description}
								header={item.header}
								className={i === 3 || i === 6 ? "md:col-span-2" : ""}
							/>
						))}
					</BentoGrid>
				</motion.div>
			</div>
		</section>
	);
}

const FeatureHeaderWrapper = ({ children }: { children: React.ReactNode }) => (
	<div className="flex flex-1 mb-2 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 relative overflow-hidden group">
		<div className="absolute inset-0 flex items-center justify-center">
			<div className="flex flex-col items-center space-y-2 z-10">
				{children}
			</div>
		</div>
	</div>
);
