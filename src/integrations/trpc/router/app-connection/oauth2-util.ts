import { OAuth2GrantType } from "@/app/mcp/mcp-app/property/authentication/oauth2-prop";
import type { BaseOAuth2ConnectionValue } from "@/types/app-connection";

export const oauth2Util = {
	formatOAuth2Response: (
		response: Omit<BaseOAuth2ConnectionValue, "claimed_at">,
	): BaseOAuth2ConnectionValue => {
		const secondsSinceEpoch = Math.round(Date.now() / 1000);
		const formattedResponse: BaseOAuth2ConnectionValue = {
			...response,
			data: response,
			claimed_at: secondsSinceEpoch,
		};

		deleteProps(formattedResponse.data, [
			"access_token",
			"expires_in",
			"refresh_token",
			"scope",
			"token_type",
		]);
		return formattedResponse;
	},
	isExpired: (connection: BaseOAuth2ConnectionValue): boolean => {
		const secondsSinceEpoch = Math.round(Date.now() / 1000);
		const grantType =
			connection.grant_type ?? OAuth2GrantType.AUTHORIZATION_CODE;
		if (
			grantType === OAuth2GrantType.AUTHORIZATION_CODE &&
			!connection.refresh_token
		) {
			return false;
		}
		const expiresIn = connection.expires_in ?? 60 * 60;
		const refreshThreshold = 15 * 60;
		return (
			secondsSinceEpoch + refreshThreshold >= connection.claimed_at + expiresIn
		);
	},

	// removeRefreshTokenAndClientSecret: (
	// 	connection: AppConnection,
	// ): AppConnection => {
	// 	if (
	// 		connection.value.type === AppConnectionType.OAUTH2 &&
	// 		connection.value.grant_type === OAuth2GrantType.CLIENT_CREDENTIALS
	// 	) {
	// 		connection.value.client_secret = "(REDACTED)";
	// 	}
	// 	if (
	// 		connection.value.type === AppConnectionType.OAUTH2 ||
	// 		connection.value.type === AppConnectionType.CLOUD_OAUTH2 ||
	// 		connection.value.type === AppConnectionType.PLATFORM_OAUTH2
	// 	) {
	// 		connection.value = {
	// 			...connection.value,
	// 			refresh_token: "(REDACTED)",
	// 		};
	// 	}
	// 	return connection;
	// },
};

export function deleteProps<
	T extends Record<string, unknown>,
	K extends keyof T,
>(obj: T, prop: K[]): Omit<T, K> {
	const newObj = { ...obj };
	for (const p of prop) {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete newObj[p];
	}
	return newObj;
}

/**i.e props: {projectId: "123"} and value: "{{projectId}}" will return "123" */
export const resolveValueFromProps = (
	props: Record<string, string> | undefined,
	value: string,
) => {
	let resolvedScope = value;
	if (!props) {
		return resolvedScope;
	}
	Object.entries(props).forEach(([key, value]) => {
		resolvedScope = resolvedScope.replace(`{${key}}`, String(value));
	});
	return resolvedScope;
};
