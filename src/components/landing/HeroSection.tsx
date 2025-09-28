import { useTRPC } from "@/integrations/trpc/react";
import { authQueries } from "@/services/queries";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Play, X } from "lucide-react";
import { useState } from "react";
import { RemoteMcpLogo } from "../icons";
import { BackgroundBeamsWithCollision } from "../ui/background-beams-with-collision";
import { Button } from "../ui/button";
import { LayoutTextFlip } from "../ui/layout-text-flip";

export function HeroSection() {
	const [isVideoPlaying, setIsVideoPlaying] = useState(false);
	const [showThumbnail, setShowThumbnail] = useState(true);
	const trpc = useTRPC();
	const { data: apps } = useSuspenseQuery(
		trpc.mcpApp.getAvailableApps.queryOptions(),
	);
	// Use useQuery directly instead of useUserSession for optional authentication
	const { data: session } = useQuery(authQueries.user());

	const toolsCount = apps
		.map((app) => app.tools.length)
		.reduce((a, b) => a + b, 0);

	const flipWords = ["AI Agents", "MCP Servers", "Cloud Apps", "Remote Tools"];

	return (
		<div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
			<BackgroundBeamsWithCollision>
				<div className="relative z-10 max-w-7xl mx-auto px-4 min-h-screen sm:px-6 lg:px-8 pt-20 pb-8">
					{/* Two Column Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-10rem)]">
						{/* Left Column - Content */}
						<motion.div
							initial={{ opacity: 0, x: -50 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.8 }}
							className="text-left space-y-8"
						>
							{/* Logo */}
							<motion.div
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.2 }}
								className="mb-6"
							>
								<div className="bg-white/10 backdrop-blur-sm rounded-full p-4 w-fit border border-white/20">
									<RemoteMcpLogo className="h-16 w-16 text-white" />
								</div>
							</motion.div>

							{/* Main Headline */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 1, delay: 0.4 }}
							>
								<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
									<div className="flex flex-col items-start gap-4">
										<LayoutTextFlip
											text="Connect your"
											words={flipWords}
											duration={2500}
										/>
									</div>
									<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
										to the real world
									</span>
								</h1>
							</motion.div>

							{/* Subheadline */}
							<motion.p
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.6 }}
								className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-lg"
							>
								Create and manage MCP servers in the cloud. No complex setup
								required. Connect to GitHub, Slack, YouTube, PostgreSQL, and{" "}
								{toolsCount}+ tools across {apps?.length || 0} integrated
								applications.
							</motion.p>

							{/* Stats */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.8 }}
								className="flex space-x-8 text-gray-300"
							>
								<div>
									<div className="text-2xl font-bold text-white">
										{toolsCount}+
									</div>
									<div className="text-sm">Tools Available</div>
								</div>
								<div>
									<div className="text-2xl font-bold text-white">
										{apps?.length || 0}
									</div>
									<div className="text-sm">Apps Integrated</div>
								</div>
								<div>
									<div className="text-2xl font-bold text-white">0</div>
									<div className="text-sm">Setup Required</div>
								</div>
							</motion.div>

							{/* CTAs */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 1.0 }}
								className="flex flex-col sm:flex-row gap-4"
							>
								<Link to="/login">
									<Button
										size="lg"
										className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-3"
									>
										{session ? "Go to Dashboard" : "Get Started Free"}
										<ArrowRight className="ml-2 h-5 w-5" />
									</Button>
								</Link>
							</motion.div>

							{/* Trusted by */}
							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.8, delay: 1.2 }}
								className="text-gray-500 text-sm"
							>
								Built for AI agents • Trusted by developers worldwide
							</motion.p>
						</motion.div>

						{/* Right Column - Video */}
						<motion.div
							initial={{ opacity: 0, x: 50 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.8, delay: 0.4 }}
							className="relative"
						>
							{/* Video Container */}
							<div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
								{/* Video */}
								<div className="aspect-video relative group w-full">
									{!isVideoPlaying && showThumbnail ? (
										/* Video Thumbnail/Placeholder */
										<div
											className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
											onClick={() => {
												setIsVideoPlaying(true);
												setShowThumbnail(false);
											}}
										>
											{/* Video Thumbnail Background */}
											<div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />

											{/* Play Button */}
											<motion.div
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.95 }}
												className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-6 border border-white/30 group-hover:bg-white/30 transition-all duration-300"
											>
												<Play className="h-8 w-8 text-white ml-1" />
											</motion.div>

											{/* Overlay Text */}
											<div className="absolute bottom-4 left-4 right-4">
												<div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/20">
													<h3 className="text-white font-semibold text-sm mb-1">
														See Remote MCP in Action
													</h3>
													<p className="text-gray-300 text-xs">
														Watch how to connect AI agents to external tools in
														minutes
													</p>
												</div>
											</div>
										</div>
									) : (
										/* Actual Video Player */
										<div className="absolute inset-0">
											<video
												className="w-full h-full  rounded-xl"
												controls
												autoPlay
												muted
												playsInline
												title="Demo: See Remote MCP in Action – how to connect AI agents to external tools in minutes"
												onEnded={() => {
													setIsVideoPlaying(false);
													setShowThumbnail(true);
												}}
											>
												<source src="/demo.mp4" type="video/mp4" />
												Your browser does not support the video tag.
											</video>

											{/* Close/Reset Button */}
											<Button
												variant="ghost"
												size="sm"
												className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white border border-white/20"
												onClick={() => {
													setIsVideoPlaying(false);
													setShowThumbnail(true);
												}}
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									)}
								</div>

								{/* Decorative Elements - only show when thumbnail is visible */}
								{!isVideoPlaying && showThumbnail && (
									<>
										<div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
										<div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-1000" />
									</>
								)}
							</div>

							{/* Floating Stats Cards - only show when thumbnail is visible */}
						</motion.div>
					</div>
				</div>
			</BackgroundBeamsWithCollision>
		</div>
	);
}
