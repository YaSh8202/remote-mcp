import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { YoutubeTranscript } from "youtube-transcript";
import { z } from "zod";
import { youtubeAuth } from "../common";

// Analyze video sentiment
const analyzeVideoSentimentSchema = {
	videoId: z.string().describe("The YouTube video ID"),
	language: z
		.string()
		.optional()
		.describe("Language code for the transcript (e.g., 'en', 'es', 'fr')"),
};

export const analyzeVideoSentimentTool = createParameterizedTool({
	name: "analyzeVideoSentiment",
	auth: youtubeAuth,
	description:
		"Analyze the sentiment of a YouTube video based on its transcript",
	paramsSchema: analyzeVideoSentimentSchema,
	callback: async (args, extra) => {
		try {
			const transcript = await YoutubeTranscript.fetchTranscript(args.videoId, {
				lang: args.language || "en",
			});

			const text = transcript
				.map((entry: { text: string }) => entry.text)
				.join(" ");

			// Simple sentiment analysis using keyword detection
			const positiveWords = [
				"good",
				"great",
				"excellent",
				"amazing",
				"wonderful",
				"fantastic",
				"love",
				"like",
				"happy",
				"joy",
				"success",
				"win",
				"best",
				"perfect",
				"awesome",
			];
			const negativeWords = [
				"bad",
				"terrible",
				"awful",
				"hate",
				"sad",
				"angry",
				"fail",
				"failure",
				"worst",
				"horrible",
				"disgusting",
				"stupid",
				"annoying",
				"boring",
				"disappointing",
			];

			const words = text.toLowerCase().split(/\s+/);
			const positiveCount = words.filter((word) =>
				positiveWords.includes(word),
			).length;
			const negativeCount = words.filter((word) =>
				negativeWords.includes(word),
			).length;

			const totalSentimentWords = positiveCount + negativeCount;
			let sentiment = "neutral";
			let score = 0;

			if (totalSentimentWords > 0) {
				score = (positiveCount - negativeCount) / totalSentimentWords;
				if (score > 0.1) sentiment = "positive";
				else if (score < -0.1) sentiment = "negative";
			}

			const result = {
				videoId: args.videoId,
				sentiment,
				score,
				positiveWords: positiveCount,
				negativeWords: negativeCount,
				totalWords: words.length,
				confidence: Math.abs(score),
			};

			return {
				content: [
					{
						type: "text" as const,
						text: `Sentiment analysis for video ${args.videoId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error analyzing video sentiment: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Generate video summary
const generateVideoSummarySchema = {
	videoId: z.string().describe("The YouTube video ID"),
	language: z
		.string()
		.optional()
		.describe("Language code for the transcript (e.g., 'en', 'es', 'fr')"),
	maxLength: z
		.number()
		.optional()
		.describe("Maximum length of the summary in characters"),
};

export const generateVideoSummaryTool = createParameterizedTool({
	name: "generateVideoSummary",
	auth: youtubeAuth,
	description: "Generate a summary of a YouTube video based on its transcript",
	paramsSchema: generateVideoSummarySchema,
	callback: async (args, extra) => {
		try {
			const transcript = await YoutubeTranscript.fetchTranscript(args.videoId, {
				lang: args.language || "en",
			});

			const text = transcript
				.map((entry: { text: string }) => entry.text)
				.join(" ");
			const maxLength = args.maxLength || 500;

			// Simple extractive summarization
			const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

			// Score sentences based on word frequency
			const wordFreq: Record<string, number> = {};
			const words = text.toLowerCase().split(/\s+/);

			for (const rawWord of words) {
				const cleanWord = rawWord.replace(/[^\w]/g, "");
				if (cleanWord.length > 3) {
					wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
				}
			}

			const sentenceScores = sentences.map((sentence) => {
				const sentenceWords = sentence.toLowerCase().split(/\s+/);
				const score = sentenceWords.reduce((sum, rawWord) => {
					const cleanWord = rawWord.replace(/[^\w]/g, "");
					return sum + (wordFreq[cleanWord] || 0);
				}, 0);
				return { sentence: sentence.trim(), score };
			});

			// Sort by score and take top sentences
			sentenceScores.sort((a, b) => b.score - a.score);

			let summary = "";
			let currentLength = 0;

			for (const { sentence } of sentenceScores) {
				if (currentLength + sentence.length <= maxLength) {
					summary += `${sentence}. `;
					currentLength += sentence.length + 2;
				} else {
					break;
				}
			}

			const result = {
				videoId: args.videoId,
				summary: summary.trim(),
				originalLength: text.length,
				summaryLength: summary.length,
				compressionRatio: Math.round((1 - summary.length / text.length) * 100),
			};

			return {
				content: [
					{
						type: "text" as const,
						text: `Video summary for ${args.videoId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error generating video summary: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Extract key topics
const extractKeyTopicsSchema = {
	videoId: z.string().describe("The YouTube video ID"),
	language: z
		.string()
		.optional()
		.describe("Language code for the transcript (e.g., 'en', 'es', 'fr')"),
	topicCount: z
		.number()
		.min(1)
		.max(20)
		.optional()
		.describe("Number of key topics to extract (1-20)"),
};

export const extractKeyTopicsTool = createParameterizedTool({
	name: "extractKeyTopics",
	auth: youtubeAuth,
	description:
		"Extract key topics from a YouTube video based on its transcript",
	paramsSchema: extractKeyTopicsSchema,
	callback: async (args, extra) => {
		try {
			const transcript = await YoutubeTranscript.fetchTranscript(args.videoId, {
				lang: args.language || "en",
			});

			const text = transcript
				.map((entry: { text: string }) => entry.text)
				.join(" ");
			const topicCount = args.topicCount || 5;

			// Extract keywords using simple frequency analysis
			const words = text.toLowerCase().split(/\s+/);
			const wordFreq: Record<string, number> = {};

			// Common stop words to filter out
			const stopWords = new Set([
				"the",
				"a",
				"an",
				"and",
				"or",
				"but",
				"in",
				"on",
				"at",
				"to",
				"for",
				"of",
				"with",
				"by",
				"is",
				"are",
				"was",
				"were",
				"be",
				"been",
				"being",
				"have",
				"has",
				"had",
				"do",
				"does",
				"did",
				"will",
				"would",
				"could",
				"should",
				"may",
				"might",
				"must",
				"can",
				"this",
				"that",
				"these",
				"those",
				"i",
				"you",
				"he",
				"she",
				"it",
				"we",
				"they",
				"me",
				"him",
				"her",
				"us",
				"them",
				"my",
				"your",
				"his",
				"her",
				"its",
				"our",
				"their",
				"myself",
				"yourself",
				"himself",
				"herself",
				"itself",
				"ourselves",
				"yourselves",
				"themselves",
				"what",
				"which",
				"who",
				"whom",
				"whose",
				"where",
				"when",
				"why",
				"how",
				"all",
				"any",
				"both",
				"each",
				"few",
				"more",
				"most",
				"other",
				"some",
				"such",
				"no",
				"nor",
				"not",
				"only",
				"own",
				"same",
				"so",
				"than",
				"too",
				"very",
				"just",
				"now",
			]);

			for (const rawWord of words) {
				const cleanWord = rawWord.replace(/[^\w]/g, "");
				if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
					wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
				}
			}

			// Sort by frequency and take top words as topics
			const topics = Object.entries(wordFreq)
				.sort((a, b) => b[1] - a[1])
				.slice(0, topicCount)
				.map(([word, frequency]) => ({
					topic: word,
					frequency,
					relevance: Math.round((frequency / words.length) * 1000) / 10,
				}));

			const result = {
				videoId: args.videoId,
				topics,
				totalWords: words.length,
				uniqueWords: Object.keys(wordFreq).length,
			};

			return {
				content: [
					{
						type: "text" as const,
						text: `Key topics for video ${args.videoId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error extracting key topics: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});

// Generate timestamps
const generateTimestampsSchema = {
	videoId: z.string().describe("The YouTube video ID"),
	language: z
		.string()
		.optional()
		.describe("Language code for the transcript (e.g., 'en', 'es', 'fr')"),
	segmentDuration: z
		.number()
		.min(10)
		.max(300)
		.optional()
		.describe("Duration of each segment in seconds (10-300)"),
};

export const generateTimestampsTool = createParameterizedTool({
	name: "generateTimestamps",
	auth: youtubeAuth,
	description: "Generate timestamps for key moments in a YouTube video",
	paramsSchema: generateTimestampsSchema,
	callback: async (args, extra) => {
		try {
			const transcript = await YoutubeTranscript.fetchTranscript(args.videoId, {
				lang: args.language || "en",
			});

			const segmentDuration = (args.segmentDuration || 60) * 1000; // Convert to milliseconds
			const segments = [];

			let currentSegment = {
				startTime: 0,
				endTime: 0,
				text: "",
			};

			for (const entry of transcript) {
				if (entry.offset - currentSegment.startTime >= segmentDuration) {
					if (currentSegment.text.trim()) {
						segments.push({
							...currentSegment,
							endTime: entry.offset,
							timestamp: `${Math.floor(currentSegment.startTime / 60000)}:${Math.floor(
								(currentSegment.startTime % 60000) / 1000,
							)
								.toString()
								.padStart(2, "0")}`,
						});
					}
					currentSegment = {
						startTime: entry.offset,
						endTime: entry.offset,
						text: entry.text,
					};
				} else {
					currentSegment.text += ` ${entry.text}`;
				}
			}

			// Add the last segment
			if (currentSegment.text.trim()) {
				segments.push({
					...currentSegment,
					endTime: transcript[transcript.length - 1].offset,
					timestamp: `${Math.floor(currentSegment.startTime / 60000)}:${Math.floor(
						(currentSegment.startTime % 60000) / 1000,
					)
						.toString()
						.padStart(2, "0")}`,
				});
			}

			const result = {
				videoId: args.videoId,
				segments,
				totalSegments: segments.length,
				segmentDuration: args.segmentDuration || 60,
			};

			return {
				content: [
					{
						type: "text" as const,
						text: `Generated timestamps for video ${args.videoId}:\n\n${JSON.stringify(result, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error generating timestamps: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
