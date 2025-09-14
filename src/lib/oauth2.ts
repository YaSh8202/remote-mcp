import { randomBytes } from "node:crypto";
import { db } from "@/db";
import {
	type NewOAuthAccessToken,
	oauthAccessTokens,
	oauthAuthorizationCodes,
	oauthClients,
} from "@/db/schema";
import { generateId } from "@/lib/id";
import OAuth2Server from "@node-oauth/oauth2-server";
import type {
	AuthorizationCode,
	Client,
	RefreshToken,
	Token,
	User,
} from "@node-oauth/oauth2-server";
import { and, eq } from "drizzle-orm";

export const oauthServer = new OAuth2Server({
	allowEmptyState: true,
	model: {
		async getClient(clientId: string, clientSecret?: string) {
			const client = await db.query.oauthClients.findFirst({
				where: and(
					eq(oauthClients.id, clientId),
					clientSecret ? eq(oauthClients.secret, clientSecret) : undefined,
				),
			});

			if (!client) throw new Error("Client not found");

			return {
				id: client.id,
				redirectUris: client.redirectUris,
				grants: client.grants,
				accessTokenLifetime: Number(client.accessTokenLifetime),
				refreshTokenLifetime: Number(client.refreshTokenLifetime),
			};
		},

		async saveAuthorizationCode(
			code: AuthorizationCode,
			client: Client,
			user: User,
		) {
			await db.insert(oauthAuthorizationCodes).values({
				id: generateId(),
				authorizationCode: code.authorizationCode,
				expiresAt: code.expiresAt,
				redirectUri: code.redirectUri,
				scope: code.scope || [],
				clientId: client.id,
				userId: user.id,
				codeChallenge: code.codeChallenge || null,
				codeChallengeMethod: code.codeChallengeMethod || null,
			});
			return code;
		},

		async getAuthorizationCode(authorizationCode: string) {
			const code = await db.query.oauthAuthorizationCodes.findFirst({
				where: eq(oauthAuthorizationCodes.authorizationCode, authorizationCode),
				with: {
					user: true,
					client: true,
				},
			});

			if (!code || !code.user || !code.client) {
				throw new Error("Authorization code not found");
			}

			return {
				authorizationCode: code.authorizationCode,
				expiresAt: code.expiresAt,
				redirectUri: code.redirectUri,
				scope: code.scope,
				client: {
					id: code.client.id,
					redirectUris: code.client.redirectUris,
					grants: code.client.grants,
					accessTokenLifetime: Number(code.client.accessTokenLifetime),
					refreshTokenLifetime: Number(code.client.refreshTokenLifetime),
				},
				user: code.user,
				codeChallenge: code.codeChallenge || undefined,
				codeChallengeMethod: code.codeChallengeMethod || undefined,
			};
		},

		async revokeAuthorizationCode(code: AuthorizationCode) {
			const result = await db
				.delete(oauthAuthorizationCodes)
				.where(
					eq(oauthAuthorizationCodes.authorizationCode, code.authorizationCode),
				);
			return result.count === 1;
		},

		async revokeToken(token: RefreshToken) {
			const result = await db
				.delete(oauthAccessTokens)
				.where(eq(oauthAccessTokens.refreshToken, token.refreshToken));
			return result.count === 1;
		},

		async saveToken(token: Token, client: Client, user: User) {
			const tokenId = generateId();

			// Ensure required fields are provided
			if (
				!token.accessToken ||
				!token.accessTokenExpiresAt ||
				!token.refreshToken ||
				!token.refreshTokenExpiresAt
			) {
				throw new Error(
					"Access token, access token expiry, refresh token and refresh token expiry are required",
				);
			}

			const tokenData: NewOAuthAccessToken = {
				id: tokenId,
				accessToken: token.accessToken,
				accessTokenExpiresAt: token.accessTokenExpiresAt,
				refreshToken: token.refreshToken,
				refreshTokenExpiresAt: token.refreshTokenExpiresAt,
				scope: token.scope || [],
				clientId: client.id,
				userId: user.id,
			};

			await db.insert(oauthAccessTokens).values(tokenData);

			return {
				accessToken: token.accessToken,
				accessTokenExpiresAt: token.accessTokenExpiresAt,
				refreshToken: token.refreshToken,
				refreshTokenExpiresAt: token.refreshTokenExpiresAt,
				scope: token.scope,
				client: client,
				user: user,

				// other formats, i.e. for compatibility
				access_token: token.accessToken,
				refresh_token: token.refreshToken,
			};
		},

		async getAccessToken(accessToken: string) {
			const token = await db.query.oauthAccessTokens.findFirst({
				where: eq(oauthAccessTokens.accessToken, accessToken),
				with: {
					user: true,
					client: true,
				},
			});

			if (!token || !token.user || !token.client) {
				throw new Error("Access token not found");
			}

			return {
				accessToken: token.accessToken,
				accessTokenExpiresAt: token.accessTokenExpiresAt,
				scope: token.scope,
				client: {
					id: token.client.id,
					redirectUris: token.client.redirectUris,
					grants: token.client.grants,
					accessTokenLifetime: Number(token.client.accessTokenLifetime),
					refreshTokenLifetime: Number(token.client.refreshTokenLifetime),
				},
				user: token.user,
			};
		},

		async getRefreshToken(refreshToken: string) {
			const token = await db.query.oauthAccessTokens.findFirst({
				where: eq(oauthAccessTokens.refreshToken, refreshToken),
				with: {
					user: true,
					client: true,
				},
			});

			if (!token || !token.user || !token.client) {
				throw new Error("Refresh token not found");
			}

			return {
				refreshToken: token.refreshToken,
				refreshTokenExpiresAt: token.refreshTokenExpiresAt,
				scope: token.scope,
				client: {
					id: token.client.id,
					redirectUris: token.client.redirectUris,
					grants: token.client.grants,
					accessTokenLifetime: Number(token.client.accessTokenLifetime),
					refreshTokenLifetime: Number(token.client.refreshTokenLifetime),
				},
				user: token.user,
			};
		},

		generateAccessToken: async () => {
			return randomBytes(32).toString("hex");
		},

		generateRefreshToken: async () => {
			return randomBytes(32).toString("hex");
		},

		generateAuthorizationCode: async () => {
			return randomBytes(32).toString("hex");
		},
	}, // See https://github.com/oauthjs/node-oauth2-server for specification
});
