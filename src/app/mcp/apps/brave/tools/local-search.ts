import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { BraveSearch } from "brave-search";
import { SafeSearchLevel } from "brave-search/dist/types.js";
import { z } from "zod";
import { braveAuth } from "../common";

// Custom local search implementation
interface LocalPoiResult {
	id: string;
	name: string;
	address: string;
	phone?: string;
	website?: string;
	rating?: number;
	review_count?: number;
	opening_hours?: {
		open_now?: boolean;
		hours?: string[];
	};
}

interface LocalPoiResponse {
	type: "local_pois";
	results: LocalPoiResult[];
}

interface LocalDescriptionResult {
	id: string;
	description: string;
}

interface LocalDescriptionResponse {
	type: "local_descriptions";
	results: LocalDescriptionResult[];
}

const localSearchSchema = {
	query: z
		.string()
		.describe("Local search query (e.g. 'pizza near Central Park')"),
	count: z
		.number()
		.min(1)
		.max(20)
		.optional()
		.describe("The number of results to return (1-20, default 10)"),
};

export const braveLocalSearchTool = createParameterizedTool({
	name: "localSearch",
	auth: braveAuth,
	description:
		"Search for local businesses, services and points of interest using Brave's Local Search API. Best for queries related to physical locations, businesses, restaurants, services, etc. Note: Requires a Pro API plan for location results.",
	paramsSchema: localSearchSchema,
	callback: async (args, extra) => {
		try {
			const apiKey = extra?.auth;
			if (!apiKey) {
				throw new Error("Brave Search API key is required");
			}

			const braveSearch = new BraveSearch(apiKey);

			// First try to get location results via web search with location filter
			const webResult = await braveSearch.webSearch(args.query, {
				count: args.count || 10,
				safesearch: SafeSearchLevel.Strict,
				result_filter: "locations",
			});

			// If no location results, fall back to regular web search
			if (!webResult.locations || webResult.locations.results.length === 0) {
				const fallbackResult = await braveSearch.webSearch(args.query, {
					count: args.count || 10,
					safesearch: SafeSearchLevel.Strict,
				});

				if (!fallbackResult.web || fallbackResult.web.results.length === 0) {
					return {
						content: [
							{
								type: "text" as const,
								text: `No local search results found for "${args.query}". Note: Local search requires a Pro API plan. Falling back to web search also returned no results.`,
							},
						],
					};
				}

				const webResults = fallbackResult.web.results
					.map(
						(item) =>
							`Title: ${item.title}\nURL: ${item.url}\nDescription: ${item.description}`,
					)
					.join("\n\n");

				return {
					content: [
						{
							type: "text" as const,
							text: `No location-specific results found for "${args.query}" (Pro API plan required for local search). Here are general web results:\n\n${webResults}`,
						},
					],
				};
			}

			// Extract location IDs for detailed POI and description data
			const locationIds = webResult.locations.results.map(
				(location) => location.id,
			);
			const limitedIds = locationIds.slice(0, args.count || 10);

			try {
				// Fetch POI details
				const poiUrl = `https://api.search.brave.com/res/v1/local/pois?${limitedIds.map((id) => `ids=${encodeURIComponent(id)}`).join("&")}`;
				const poiResponse = await fetch(poiUrl, {
					method: "GET",
					headers: {
						Accept: "*/*",
						"Accept-Encoding": "gzip, deflate, br",
						Connection: "keep-alive",
						"X-Subscription-Token": apiKey,
						"User-Agent": "BraveSearchMCP/1.0",
						"Content-Type": "application/json",
						"Cache-Control": "no-cache",
					},
				});

				let poiData: LocalPoiResponse | null = null;
				if (poiResponse.ok) {
					poiData = await poiResponse.json();
				}

				// Fetch descriptions
				const descUrl = `https://api.search.brave.com/res/v1/local/descriptions?${limitedIds.map((id) => `ids=${encodeURIComponent(id)}`).join("&")}`;
				const descResponse = await fetch(descUrl, {
					method: "GET",
					headers: {
						Accept: "*/*",
						"Accept-Encoding": "gzip, deflate, br",
						Connection: "keep-alive",
						"X-Subscription-Token": apiKey,
						"User-Agent": "BraveSearchMCP/1.0",
						"Content-Type": "application/json",
						"Cache-Control": "no-cache",
					},
				});

				let descData: LocalDescriptionResponse | null = null;
				if (descResponse.ok) {
					descData = await descResponse.json();
				}

				// Format results
				const localResults = limitedIds
					.map((id) => {
						const poi = poiData?.results.find((p) => p.id === id);
						const description = descData?.results.find((d) => d.id === id);

						let result = `Name: ${poi?.name || "Unknown"}\n`;
						result += `Address: ${poi?.address || "Unknown"}\n`;

						if (poi?.phone) {
							result += `Phone: ${poi.phone}\n`;
						}

						if (poi?.website) {
							result += `Website: ${poi.website}\n`;
						}

						if (poi?.rating) {
							result += `Rating: ${poi.rating}`;
							if (poi.review_count) {
								result += ` (${poi.review_count} reviews)`;
							}
							result += "\n";
						}

						if (poi?.opening_hours) {
							if (poi.opening_hours.open_now !== undefined) {
								result += `Open now: ${poi.opening_hours.open_now ? "Yes" : "No"}\n`;
							}
							if (poi.opening_hours.hours) {
								result += `Hours: ${poi.opening_hours.hours.join(", ")}\n`;
							}
						}

						if (description?.description) {
							result += `Description: ${description.description}\n`;
						}

						return result;
					})
					.join("\n---\n");

				return {
					content: [
						{
							type: "text" as const,
							text: `Local search results for "${args.query}":\n\n${localResults}`,
						},
					],
				};
			} catch (apiError) {
				// If POI/description API calls fail, return basic location info
				const basicResults = webResult.locations.results
					.slice(0, args.count || 10)
					.map((location) => `Location ID: ${location.id}`)
					.join("\n");

				return {
					content: [
						{
							type: "text" as const,
							text: `Found ${webResult.locations.results.length} location(s) for "${args.query}", but detailed information requires Pro API plan access:\n\n${basicResults}`,
						},
					],
				};
			}
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error performing local search: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
});
