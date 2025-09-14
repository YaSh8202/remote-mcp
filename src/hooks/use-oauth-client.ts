import { useQuery } from "@tanstack/react-query";

interface OAuthClient {
	id: string;
	redirectUris: string[];
	scope: string[];
	name: string;
	uri: string;
}

export const useOAuthClient = (params: { id: string }) => {
	const query = useQuery({
		queryKey: ["/oauth/client", params],
		queryFn: async () => {
			const response = await fetch(`/api/oauth/client?id=${params.id}`);
			if (!response.ok) {
				throw new Error("Failed to fetch OAuth client");
			}
			const data = await response.json();
			return data.data as OAuthClient;
		},
		retry: false,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		enabled: !!params.id,
	});

	return {
		oauthClient: query.data,
		query: query,
	};
};