import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { YoutubeTranscript } from "youtube-transcript";
import { z } from "zod";
import { youtubeAuth } from "../common";

// Get video transcript
const getTranscriptSchema = {
	videoId: z.string().describe("The YouTube video ID"),
	language: z
		.string()
		.optional()
		.describe("Language code for the transcript (e.g., 'en', 'es', 'fr')"),
};

export const getTranscriptTool = createParameterizedTool({
	name: "getTranscript",
	auth: youtubeAuth,
	description: "Get the transcript of a YouTube video",
	paramsSchema: getTranscriptSchema,
	callback: async (args) => {
		try {
			const result = await YoutubeTranscript.fetchTranscript(args.videoId, {
				lang: args.language || "en",
			});

			return {
				content: [
					{
						type: "text" as const,
						text: `Transcript for video ${args.videoId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving transcript: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get transcript as text
const getTranscriptTextSchema = {
	videoId: z.string().describe("The YouTube video ID"),
	language: z
		.string()
		.optional()
		.describe("Language code for the transcript (e.g., 'en', 'es', 'fr')"),
	includeTimestamps: z
		.boolean()
		.optional()
		.describe("Whether to include timestamps in the text"),
};

export const getTranscriptTextTool = createParameterizedTool({
	name: "getTranscriptText",
	auth: youtubeAuth,
	description: "Get the transcript of a YouTube video as plain text",
	paramsSchema: getTranscriptTextSchema,
	callback: async (args, extra) => {
		try {
			const transcript = await YoutubeTranscript.fetchTranscript(args.videoId, {
				lang: args.language || "en",
			});

			let text: string;
			if (args.includeTimestamps) {
				text = transcript
					.map((entry) => `[${Math.floor(entry.offset / 1000)}s] ${entry.text}`)
					.join("\n");
			} else {
				text = transcript.map((entry) => entry.text).join(" ");
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Transcript text for video ${args.videoId}:\n\n${text}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error retrieving transcript: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Search within transcript
const searchTranscriptSchema = {
	videoId: z.string().describe("The YouTube video ID"),
	query: z.string().describe("Search query to find within the transcript"),
	language: z
		.string()
		.optional()
		.describe("Language code for the transcript (e.g., 'en', 'es', 'fr')"),
	caseSensitive: z
		.boolean()
		.optional()
		.describe("Whether the search should be case sensitive"),
};

export const searchTranscriptTool = createParameterizedTool({
	name: "searchTranscript",
	auth: youtubeAuth,
	description: "Search for specific text within a YouTube video transcript",
	paramsSchema: searchTranscriptSchema,
	callback: async (args, extra) => {
		try {
			const transcript = await YoutubeTranscript.fetchTranscript(args.videoId, {
				lang: args.language || "en",
			});

			const searchQuery = args.caseSensitive
				? args.query
				: args.query.toLowerCase();
			const matches = transcript.filter((entry) => {
				const text = args.caseSensitive ? entry.text : entry.text.toLowerCase();
				return text.includes(searchQuery);
			});

			const results = matches.map((entry) => ({
				...entry,
				timestampSeconds: Math.floor(entry.offset / 1000),
			}));

			return {
				content: [
					{
						type: "text" as const,
						text: `Search results for "${args.query}" in video ${args.videoId}:\n\n${JSON.stringify(results, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error searching transcript: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get transcript summary
const getTranscriptSummarySchema = {
	videoId: z.string().describe("The YouTube video ID"),
	language: z
		.string()
		.optional()
		.describe("Language code for the transcript (e.g., 'en', 'es', 'fr')"),
	maxLength: z
		.number()
		.optional()
		.describe("Maximum number of characters for the summary"),
};

export const getTranscriptSummaryTool = createParameterizedTool({
	name: "getTranscriptSummary",
	auth: youtubeAuth,
	description: "Get a summary of a YouTube video transcript",
	paramsSchema: getTranscriptSummarySchema,
	callback: async (args, extra) => {
		try {
			const transcript = await YoutubeTranscript.fetchTranscript(args.videoId, {
				lang: args.language || "en",
			});

			const fullText = transcript.map((entry) => entry.text).join(" ");
			const maxLength = args.maxLength || 500;

			// Simple summary by taking first and last portions
			let summary: string;
			if (fullText.length <= maxLength) {
				summary = fullText;
			} else {
				const firstPart = fullText.substring(0, maxLength / 2);
				const lastPart = fullText.substring(fullText.length - maxLength / 2);
				summary = `${firstPart}...\n\n[Content truncated]\n\n...${lastPart}`;
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Transcript summary for video ${args.videoId}:\n\n${summary}\n\n---\nOriginal length: ${fullText.length} characters\nSummary length: ${summary.length} characters`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error creating transcript summary: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Get transcript languages
const getTranscriptLanguagesSchema = {
	videoId: z.string().describe("The YouTube video ID"),
};

export const getTranscriptLanguagesTool = createParameterizedTool({
	name: "getTranscriptLanguages",
	auth: youtubeAuth,
	description: "Get available transcript languages for a YouTube video",
	paramsSchema: getTranscriptLanguagesSchema,
	callback: async (args, extra) => {
		try {
			// Note: youtube-transcript doesn't have a direct method to get available languages
			// We'll try common languages and see which ones work
			const commonLanguages = [
				"en",
				"es",
				"fr",
				"de",
				"it",
				"pt",
				"ru",
				"ja",
				"ko",
				"zh",
			];
			const availableLanguages = [];

			for (const lang of commonLanguages) {
				try {
					await YoutubeTranscript.fetchTranscript(args.videoId, { lang });
					availableLanguages.push(lang);
				} catch (error) {
					// Language not available, continue
				}
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Available transcript languages for video ${args.videoId}:\n\n${JSON.stringify(availableLanguages, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error getting transcript languages: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
