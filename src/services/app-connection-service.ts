import { count, eq } from "drizzle-orm";
import { mcpApps } from "@/app/mcp/apps";
import type { McpApp } from "@/app/mcp/mcp-app";
import { PropertyType } from "@/app/mcp/mcp-app/property";
import { db } from "@/db";
import {
	type AppConnectionSchema,
	AppConnectionStatus,
	AppConnectionType,
	appConnections,
	type NewAppConnection,
} from "@/db/schema";
import { getOAuthAppSecrets } from "@/env";
import { oauth2Util } from "@/integrations/trpc/router/app-connection/oauth2-util";
import { decryptObject, encryptObject } from "@/lib/encryption";
import { isNil } from "@/lib/utils";
import { credentialsOauth2Service } from "@/services/credentials-oauth2-service";
import type {
	AppConnection,
	AppConnectionValue,
	OAuth2ConnectionValueWithApp,
	SecretTextConnectionValue,
	UpsertAppConnectionRequestBody,
} from "@/types/app-connection";

const appConnectionHandler = {
	decryptConnection(encryptedConnection: AppConnectionSchema): AppConnection {
		const value = decryptObject<AppConnectionValue>(encryptedConnection.value);
		const connection: AppConnection = {
			...encryptedConnection,
			value,
		};
		return connection;
	},
	needRefresh(connection: AppConnection): boolean {
		if (connection.status === AppConnectionStatus.ERROR) {
			return false;
		}
		switch (connection.value.type) {
			case AppConnectionType.OAUTH2:
				return oauth2Util.isExpired(connection.value);
			default:
				return false;
		}
	},
};

export const appConnectionService = {
	async upsert(params: UpsertParams) {
		try {
			const validatedConnectionValue = await validateConnectionValue({
				value: params.value,
				appName: params.appName,
				ownerId: params.ownerId,
			});

			const encryptedConnectionValue = encryptObject({
				...validatedConnectionValue,
				...params.value,
			});

			return await db
				.insert(appConnections)
				.values({
					id: crypto.randomUUID(),
					appName: params.appName,
					ownerId: params.ownerId,
					displayName: params.displayName,
					value: encryptedConnectionValue,
					type: params.type,
					status: AppConnectionStatus.ACTIVE,
				} as NewAppConnection)
				.returning();
		} catch (error) {
			console.error("Error during upsert:", error);
			throw error;
		}
	},

	async getOne({ id, ownerId }: { id: string; ownerId: string }) {
		const encryptedAppConnection = await db.query.appConnections.findFirst({
			where: (appConnections, { eq, and }) =>
				and(eq(appConnections.id, id), eq(appConnections.ownerId, ownerId)),
		});

		if (isNil(encryptedAppConnection)) {
			return null;
		}

		const connection = await this.decryptAndRefreshConnection(
			encryptedAppConnection,
			ownerId,
		);

		if (isNil(connection)) {
			return null;
		}

		return connection;
	},
	async decryptAndRefreshConnection(
		encryptedAppConnection: AppConnectionSchema,
		ownerId: string,
	): Promise<AppConnection | null> {
		const appConnection = appConnectionHandler.decryptConnection(
			encryptedAppConnection,
		);

		if (
			appConnection.value.type !== AppConnectionType.OAUTH2 ||
			!appConnectionHandler.needRefresh(appConnection)
		) {
			return oauth2Util.removeRefreshTokenAndClientSecret(appConnection);
		}

		const refreshedConnectionValue = await credentialsOauth2Service.refresh({
			appName: appConnection.appName,
			ownerId,
			connectionValue: appConnection.value,
		});

		appConnection.value = refreshedConnectionValue;

		await db
			.update(appConnections)
			.set({
				value: encryptObject(refreshedConnectionValue),
				status: AppConnectionStatus.ACTIVE,
			})
			.where(eq(appConnections.id, appConnection.id));

		return appConnection;
	},

	async count(ownerId: string): Promise<number> {
		const countResult = await db
			.select({ count: count() })
			.from(appConnections)
			.where(eq(appConnections.ownerId, ownerId));
		return countResult[0]?.count || 0;
	},
};

const validateConnectionValue = async (
	params: ValidateConnectionValueParams,
): Promise<AppConnectionValue> => {
	const { value, appName } = params;
	const mcpApp = mcpApps.find((app) => app.name === params.appName);
	if (!mcpApp) {
		throw new Error(`MCP app not found: ${params.appName}`);
	}
	switch (value.type) {
		case AppConnectionType.OAUTH2: {
			const secrets = getOAuthAppSecrets();
			const secret = secrets[appName];
			if (!secret) {
				throw new Error(`No secrets found for app: ${params.appName}`);
			}

			const client_id = secret.clientId;
			const client_secret = secret.clientSecret;

			if (mcpApp.auth?.type !== PropertyType.OAUTH2) {
				throw new Error(
					`Unsupported app connection type: ${mcpApp.auth?.type}`,
				);
			}

			const tokenUrl = mcpApp.auth?.tokenUrl;
			if (!tokenUrl) {
				throw new Error(`Token URL not found for app: ${params.appName}`);
			}

			const auth = await credentialsOauth2Service.claim({
				appName: appName,
				request: {
					code: value.code,
					codeVerifier: value.code_challenge,
					clientId: client_id,
					clientSecret: client_secret,
					tokenUrl,
					scope: value.scope,
					authorizationMethod: mcpApp.auth?.authorizationMethod,
					props: value.props,
					redirectUrl: value.redirect_url,
				},
			});

			const result = await validateAuth({
				mcpApp: mcpApp,
				auth: auth as AppConnectionValue,
			});

			if (result.valid === false) {
				throw new Error(`Validation failed: ${result.error}`);
			}

			return auth;
		}
		case AppConnectionType.SECRET_TEXT: {
			const result = await validateAuth({
				mcpApp: mcpApp,
				auth: value as AppConnectionValue,
			});
			if (result.valid === false) {
				throw new Error(`Validation failed: ${result.error}`);
			}
			break;
		}

		case AppConnectionType.NO_AUTH:
			break;
	}

	return value;
};

async function validateAuth(params: {
	mcpApp: McpApp;
	auth: AppConnectionValue;
}): Promise<{ valid: true } | { valid: false; error?: string }> {
	const { mcpApp: app } = params;

	if (app.auth?.validate === undefined) {
		return {
			valid: true,
		};
	}

	switch (app.auth.type) {
		case PropertyType.SECRET_TEXT: {
			const con = params.auth as SecretTextConnectionValue;
			return app.auth.validate({
				auth: con.secret_text,
			});
		}

		case PropertyType.OAUTH2: {
			const con = params.auth as OAuth2ConnectionValueWithApp;
			return app.auth.validate({
				auth: con,
			});
		}
		default: {
			throw new Error("Invalid auth type");
		}
	}
}

type UpsertParams = {
	appName: string;
	displayName: string;
	ownerId: string;
	value: UpsertAppConnectionRequestBody["value"];
	type: AppConnectionType;
};

type ValidateConnectionValueParams = {
	value: UpsertAppConnectionRequestBody["value"];
	appName: string;
	ownerId: string;
};
