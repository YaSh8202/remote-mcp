import type { ModelsDevResponse } from "@/types/models";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

const MODELS_DEV_API_URL = "https://models.dev/api.json";

export const Route = createFileRoute("/api/models")({
	server: {
		handlers: {
			/**
			 * Proxy endpoint for models.dev API to avoid CORS issues
			 * This endpoint fetches the models data server-side and returns it to the client
			 */
			GET: async () => {
				try {
					const response = await fetch(MODELS_DEV_API_URL, {
						headers: {
							Accept: "application/json",
							"User-Agent": "RemoteMCP/1.0",
						},
					});

					if (!response.ok) {
						return json(
							{
								error: "Failed to fetch models data",
								status: response.status,
							},
							{
								status: response.status,
								headers: {
									"Cache-Control": "public, max-age=86400", // 24 hours
								},
							},
						);
					}

					const data = (await response.json()) as ModelsDevResponse;

					return json(data, {
						status: 200,
						headers: {
							"Cache-Control": "public, max-age=86400", // 24 hours
							"Access-Control-Allow-Origin": "*",
						},
					});
				} catch (error) {
					console.error("Failed to fetch models.dev data:", error);
					return json(
						{
							error: "Internal server error",
							message:
								error instanceof Error
									? error.message
									: "Unknown error occurred",
						},
						{
							status: 500,
						},
					);
				}
			},
		},
	},
});
