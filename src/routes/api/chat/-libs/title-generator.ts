import { generateText } from "ai";
import { getDefaultLLMProviderKey } from "@/services/llm-provider-service";
import type { LLMProvider } from "@/types/models";
import { getAIModel } from "./models";

const SYSTEM_PROMPT = `You are a helpful assistant that generates concise, descriptive titles for conversation chats. Generate a title that captures the main topic or intent of the conversation. The title should be:
- Maximum 50 characters
- Clear and descriptive
- In title case
- Without quotes or special formatting

Return ONLY the title text, nothing else.`;

/**
 * Generates an AI-powered chat title based on the first message content.
 *
 * @param userId - The user ID to retrieve API key
 * @param provider - The LLM provider to use
 * @param model - The model to use
 * @param firstMessageText - The text of the first message
 * @returns Generated title (max 50 chars) or fallback
 */
export async function generateChatTitle(
	userId: string,
	provider: LLMProvider,
	model: string,
	firstMessageText: string,
): Promise<string> {
	// Truncate input to 400 characters to keep prompt small
	const truncatedMessage = firstMessageText.slice(0, 400);

	// Fallback title from message text
	const fallbackTitle = truncatedMessage.slice(0, 50) || "New Chat";

	try {
		// Get the user's API key for the provider
		const apiKey = await getDefaultLLMProviderKey(userId, provider);

		if (!apiKey) {
			console.log(
				`No API key found for provider ${provider}, using fallback title`,
			);
			return fallbackTitle;
		}

		// Create the AI model instance
		const aiModel = getAIModel(provider, model, apiKey);

		// Generate the title
		const { text } = await generateText({
			model: aiModel,
			maxOutputTokens: 60,
			temperature: 0.7,
			system: SYSTEM_PROMPT,
			prompt: `Generate a title (maximum 50 characters) for a conversation that starts with this message:\n\n${truncatedMessage}`,
		});

		// Clean and validate the generated title
		const generatedTitle = text.trim();

		if (!generatedTitle) {
			console.log("Empty title generated, using fallback");
			return fallbackTitle;
		}

		// Ensure title is within 50 characters
		return generatedTitle.slice(0, 50);
	} catch (error) {
		console.error("Failed to generate chat title:", error);
		return fallbackTitle;
	}
}
