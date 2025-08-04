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
		console.log("🚀 ~ code:", code);
		form.setValue("request.value.code", code, { shouldValidate: true });
		form.setValue("request.value.code_challenge", codeChallenge, {
			shouldValidate: true,
		});
		setRefresh(refresh + 1);
	};

	return (
		<div className="flex flex-col gap-4">
			{/* {authProperty.props && (
				<AutoPropertiesFormComponent
					prefixValue="request.value.props"
					props={authProperty.props}
					useMentionTextInput={false}
					allowDynamicValues={false}
				/>
			)} */}

			{currentGrantType !== OAuth2GrantType.CLIENT_CREDENTIALS && (
				<div className="border border-solid p-2 rounded-lg gap-2 flex text-center items-center justify-center h-full">
					<div className="rounded-full border border-solid p-1 flex items-center justify-center">
						<AppLogo
							logo={app.logo}
							appName={app.displayName}
							className="w-5 h-5 rounded-full"
						/>
					</div>
					<div className="text-sm">{app.displayName}</div>
					<div className="flex-grow" />
					{!hasCode && (
						<Button
							size={"sm"}
							variant={"default"}
							disabled={!readyToConnect}
							type="button"
							onClick={async () =>
								openPopup(
									redirectUrl,
									form.getValues().request.value.client_id,
									form.getValues().request.value.props,
								)
							}
						>
							Connect
						</Button>
					)}
					{hasCode && (
						<Button
							size={"sm"}
							variant={"destructive"}
							// className="text-destructive"
							onClick={() => {
								form.setValue("request.value.code", "", {
									shouldValidate: true,
								});
								form.setValue("request.value.code_challenge", "", {
									shouldValidate: true,
								});
							}}
						>
							Disconnect
						</Button>
					)}
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
			<div className="text-red-500">
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
