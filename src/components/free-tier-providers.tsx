import { ProviderLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LLMProvider } from "@/types/models";
import { ExternalLink, Gift, Sparkles } from "lucide-react";

interface FreeTierProvider {
	provider: LLMProvider;
	name: string;
	freeTier: string;
	highlight: string;
	docsUrl: string;
}

const FREE_TIER_PROVIDERS: FreeTierProvider[] = [
	{
		provider: LLMProvider.GOOGLE,
		name: "Google Gemini",
		freeTier: "Free tier with rate limits",
		highlight: "Gemini 2.0 Flash & Pro",
		docsUrl: "https://ai.google.dev/",
	},
	{
		provider: LLMProvider.GITHUB_MODELS,
		name: "GitHub Models",
		freeTier: "Free tier with rate limits",
		highlight: "GPT-4o, Claude, Llama & more",
		docsUrl: "https://github.com/marketplace/models",
	},
	{
		provider: LLMProvider.GROQ,
		name: "Groq",
		freeTier: "Free tier available",
		highlight: "Fastest inference speed",
		docsUrl: "https://console.groq.com/",
	},
	{
		provider: LLMProvider.MISTRAL,
		name: "Mistral AI",
		freeTier: "Free credits on signup",
		highlight: "Mistral Large & Small models",
		docsUrl: "https://console.mistral.ai/",
	},
	{
		provider: LLMProvider.ALIBABA,
		name: "Alibaba Cloud",
		freeTier: "Free trial credits",
		highlight: "Qwen 2.5 & Qwen 3 models",
		docsUrl:
			"https://www.alibabacloud.com/help/en/model-studio/getting-started/",
	},
];

interface FreeTierProvidersProps {
	onProviderSelect: (provider: LLMProvider) => void;
}

export function FreeTierProviders({
	onProviderSelect,
}: FreeTierProvidersProps) {
	return (
		<div className="flex flex-col items-center justify-center h-full p-6 py-8 space-y-8">
			{/* Header Section */}
			<div className="text-center space-y-3 ">
				<div className="flex items-center justify-center gap-2">
					<Sparkles className="h-8 w-8 text-primary" />
					<h2 className="text-3xl font-bold tracking-tight">
						Start Chatting for Free
					</h2>
				</div>
				<p className="text-muted-foreground text-lg">
					Get started without any payment by using these AI providers with
					generous free tiers
				</p>
			</div>

			{/* Provider Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
				{FREE_TIER_PROVIDERS.map((provider) => (
					<Card
						key={provider.provider}
						className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer py-2"
						onClick={() => onProviderSelect(provider.provider)}
					>
						<CardContent className="p-4 space-y-3">
							{/* Provider Header */}
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
									<ProviderLogo
										provider={provider.provider}
										className="h-8 w-8"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="font-semibold text-base truncate">
										{provider.name}
									</h3>
									<div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
										<Gift className="h-3 w-3" />
										<span>{provider.freeTier}</span>
									</div>
								</div>
							</div>

							{/* Highlight Badge */}
							<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
								<Sparkles className="h-3 w-3" />
								<span className="truncate">{provider.highlight}</span>
							</div>

							{/* Actions */}
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									className="flex-1 group-hover:shadow-md transition-shadow"
									onClick={(e) => {
										e.stopPropagation();
										onProviderSelect(provider.provider);
									}}
								>
									Add API Key
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={(e) => {
										e.stopPropagation();
										window.open(provider.docsUrl, "_blank");
									}}
								>
									<ExternalLink className="h-4 w-4" />
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Footer Note */}
			<div className="text-center text-sm text-muted-foreground max-w-2xl">
				<p>
					Need access to more models?{" "}
					<span className="text-foreground font-medium">
						Add API keys for OpenAI or Anthropic
					</span>{" "}
					to unlock their full model catalog.
				</p>
			</div>
		</div>
	);
}
