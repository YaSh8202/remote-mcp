import { mcpApps } from "@/app/mcp/apps";
import { db } from "@/db";
import {
	type AppConnectionSchema,
	AppConnectionStatus,
	AppConnectionType,
	type NewAppConnection,
	appConnections,
} from "@/db/schema";
import { getOAuthAppSecrets } from "@/env";
import type { appConnectionRouter } from "@/integrations/trpc/router/app-connection";
import { oauth2Util } from "@/integrations/trpc/router/app-connection/oauth2-util";
import { decryptObject, encryptObject } from "@/lib/encryption";
import { isNil } from "@/lib/utils";
import { credentialsOauth2Service } from "@/services/credentials-oauth2-service";
import type { AppConnection, AppConnectionValue } from "@/types/app-connection";
import type { inferProcedureInput } from "@trpc/server";
import { eq } from "drizzle-orm";

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
		const type = params.type;
		const secrets = getOAuthAppSecrets();
		const secret = secrets[params.appName];
		if (!secret) {
			throw new Error(`No secrets found for app: ${params.appName}`);
		}

		const client_id = secret.clientId;
		const client_secret = secret.clientSecret;

		const mcpApp = await mcpApps.find((app) => app.name === params.appName);
		if (!mcpApp) {
			throw new Error(`MCP app not found: ${params.appName}`);
		}

		const tokenUrl = mcpApp.auth?.tokenUrl;
		if (!tokenUrl) {
			throw new Error(`Token URL not found for app: ${params.appName}`);
		}
		try {
			const validatedConnectionValue = await credentialsOauth2Service.claim({
				appName: params.appName,
				request: {
					code: params.value.code,
					codeVerifier: params.value.code_challenge,
					clientId: client_id,
					clientSecret: client_secret,
					tokenUrl,
					scope: params.value.scope,
					authorizationMethod: mcpApp.auth?.authorizationMethod,
					props: params.value.props,
					redirectUrl: params.value.redirect_url,
				},
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
					type: type,
					status: AppConnectionStatus.ACTIVE,
				} as NewAppConnection)
				.returning();
		} catch (error) {
			console.error("Error during upsert:", error);
			throw error;
		}
	},

	async getOne({
		id,
		ownerId,
	}: {
		id: string;
		ownerId: string;
	}) {
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
		if (!appConnectionHandler.needRefresh(appConnection)) {
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
};

type UpsertParams = {
	appName: string;
	displayName: string;
	ownerId: string;
	value: inferProcedureInput<(typeof appConnectionRouter)["create"]>["value"];
	type: AppConnectionType;
};
