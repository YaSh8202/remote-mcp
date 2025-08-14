import type { McpAppMetadata } from "@/app/mcp/mcp-app";
import type { OAuth2Property, OAuth2Props } from "@/app/mcp/mcp-app/property";
import {
	BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
	OAuth2GrantType,
} from "@/app/mcp/mcp-app/property/authentication/oauth2-prop";
import { AppConnectionType } from "@/db/schema";
import { useTRPC } from "@/integrations/trpc/react";
import { oauth2Utils } from "@/lib/oauth2-utils";
import { isNil } from "@/lib/utils";
import { resolveValueFromProps } from "@/services/credentials-oauth2-service";
import type { UpsertOAuth2Request } from "@/types/app-connection";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { AppLogo } from "../AppLogo";
import { Button } from "../ui/button";
import { SkeletonList } from "../ui/skeleton";

const OAuth2ConnectionSettingsForm = ({
	appClientId,
	authProperty,
	currentGrantType,
	app,
}: OAuth2ConnectionSettingsFormParams) => {
	const [readyToConnect, setReadyToConnect] = useState(false);

	const form = useFormContext<{
		request: UpsertOAuth2Request;
	}>();
	const redirectUrl = "https://remotemcp.tech/redirect";

	const hasCode = form.getValues().request.value.code;
	// biome-ignore lint/correctness/useExhaustiveDependencies: form cannot be a dependency here
	useEffect(() => {
		form.setValue(
			"request.value.redirect_url",
			redirectUrl ?? "no_redirect_url_found",
			{
				shouldValidate: true,
			},
		);
		// const defaultValuesForProps = Object.fromEntries(
		// 	Object.entries(
		// 		formUtils.getDefaultValueForStep(authProperty.props ?? {}, {}),
		// 	).map(([key, value]) => [key, value === undefined ? "" : value]),
		// );
		// form.setValue("request.value.props", defaultValuesForProps, {
		// 	shouldValidate: true,
		// });
		// form.setValue(
		// 	"request.value.client_secret",
		// 	currentOAuth2Type === AppConnectionType.OAUTH2 ? "" : "FAKE_SECRET",
		// 	{ shouldValidate: true },
		// );
		form.setValue("request.value.client_id", appClientId, {
			shouldValidate: true,
		});
		// form.setValue("request.value.grant_type", currentGrantType, {
		// 	shouldValidate: true,
		// });
		form.setValue(
			"request.value.code",
			currentGrantType === OAuth2GrantType.CLIENT_CREDENTIALS
				? "FAKE_CODE"
				: "",
			{ shouldValidate: true },
		);
		form.setValue("request.value.code_challenge", "", { shouldValidate: true });
		form.setValue("request.value.type", AppConnectionType.OAUTH2, {
			shouldValidate: true,
		});
		form.setValue("request.type", AppConnectionType.OAUTH2, {
			shouldValidate: true,
		});
	}, []);

	form.watch((values) => {
		const baseCriteria =
			!isNil(redirectUrl) && !isNil(values.request?.value?.client_id);

		const propsValues = values.request?.value?.props ?? {};
		const arePropsValid = authProperty.props
			? Object.keys(authProperty.props).reduce((acc, key) => {
					return (
						acc &&
						((!isNil(propsValues[key]) && propsValues[key] !== "") ||
							!authProperty.props?.[key]?.required)
					);
				}, true)
			: true;
		setReadyToConnect(baseCriteria && arePropsValid);
	});
	const [refresh, setRefresh] = useState(0);
	const openPopup = async (
		redirectUrl: string,
		clientId: string,
		props: Record<string, string> | undefined,
	) => {
		const scope = resolveValueFromProps(props, authProperty.scope.join(" "));
		const authUrl = resolveValueFromProps(props, authProperty.authUrl);
		const { code, codeChallenge } = await oauth2Utils.openOAuth2Popup({
			authUrl,
			clientId,
			redirectUrl,
			scope,
			pkce: authProperty.pkce ?? false,
			extraParams: authProperty.extra ?? {},
		});
		form.setValue("request.value.code", code, { shouldValidate: true });
		form.setValue("request.value.code_challenge", codeChallenge, {
			shouldValidate: true,
		});
		setRefresh(refresh + 1);
	};

	return (
		<div className="space-y-6">
			{/* {authProperty.props && (
				<AutoPropertiesFormComponent
					prefixValue="request.value.props"
					props={authProperty.props}
					useMentionTextInput={false}
					allowDynamicValues={false}
				/>
			)} */}

			{currentGrantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
				<div className="relative">
					<div className="p-6 rounded-xl border-2 border-dashed border-border/60 bg-gradient-to-br from-background to-muted/20 hover:border-border transition-colors">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="relative">
									<div className="p-2 rounded-full bg-primary/10 border border-primary/20">
										<AppLogo
											logo={app.logo}
											appName={app.displayName}
											className="w-6 h-6"
										/>
									</div>
									{hasCode && (
										<div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
									)}
								</div>
								<div className="space-y-1">
									<h3 className="text-sm font-semibold text-foreground">
										{app.displayName}
									</h3>
									<p className="text-xs text-muted-foreground">
										{hasCode ? "Connected" : "Ready to connect"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{hasCode && (
									<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
										<div className="w-1.5 h-1.5 rounded-full bg-green-500" />
										<span className="text-xs font-medium text-green-700 dark:text-green-300">
											Authorized
										</span>
									</div>
								)}

								{!hasCode && (
									<Button
										size="sm"
										variant="default"
										disabled={!readyToConnect}
										type="button"
										onClick={async () =>
											openPopup(
												redirectUrl,
												form.getValues().request.value.client_id,
												form.getValues().request.value.props,
											)
										}
										className="shadow-sm"
									>
										<svg
											className="w-4 h-4 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-label="Connect"
										>
											<title>Connect</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
											/>
										</svg>
										Connect
									</Button>
								)}

								{hasCode && (
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											form.setValue("request.value.code", "", {
												shouldValidate: true,
											});
											form.setValue("request.value.code_challenge", "", {
												shouldValidate: true,
											});
										}}
										className="text-muted-foreground hover:text-destructive hover:border-destructive/30"
									>
										<svg
											className="w-4 h-4 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-label="Disconnect"
										>
											<title>Disconnect</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
										Disconnect
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

type OAuth2ConnectionSettingsFormParams = {
	appClientId: string;
	authProperty: OAuth2Property<OAuth2Props>;
	currentGrantType: OAuth2GrantType;
	app: McpAppMetadata;
};

const OAuth2ConnectionSettings = (props: OAuth2ConnectionSettingsProps) => {
	const trpc = useTRPC();

	const { data: appToClientIdMap, isPending: loadingAppToClientIdMap } =
		useQuery(trpc.mcpApp.oauthAppsClientId.queryOptions());

	if (loadingAppToClientIdMap || isNil(appToClientIdMap)) {
		return <SkeletonList numberOfItems={2} className="h-7" />;
	}

	const clientId = appToClientIdMap[props.app.name]?.clientId;
	if (isNil(clientId)) {
		return (
			<div className="text-destructive">
				Client ID not found for app: {props.app.displayName}
			</div>
		);
	}

	return (
		<OAuth2ConnectionSettingsForm
			appClientId={clientId}
			currentGrantType={
				props.authProperty.grantType ===
				BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE
					? OAuth2GrantType.AUTHORIZATION_CODE
					: (props.authProperty.grantType ?? OAuth2GrantType.AUTHORIZATION_CODE)
			}
			{...props}
		/>
	);
};

type OAuth2ConnectionSettingsProps = {
	app: McpAppMetadata;
	authProperty: OAuth2Property<OAuth2Props>;
};

export { OAuth2ConnectionSettings };
