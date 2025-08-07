import type { SecretTextProperty } from "@/app/mcp/mcp-app/property";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UpsertSecretTextRequest } from "@/types/app-connection";
import React from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

type SecretTextConnectionSettingsProps = {
	authProperty: SecretTextProperty<boolean>;
};

const SecretTextConnectionSettings = React.memo(
	({ authProperty }: SecretTextConnectionSettingsProps) => {
		const formSchema = z.object({
			request: UpsertSecretTextRequest,
		});

		const form = useFormContext<z.infer<typeof formSchema>>();

		return (
			<FormField
				name="request.value.secret_text"
				control={form.control}
				render={({ field }) => (
					<FormItem className="flex flex-col">
						<FormLabel>{authProperty.displayName}</FormLabel>
						<FormControl>
							<Input {...field} type="password" />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
);

SecretTextConnectionSettings.displayName = "SecretTextConnectionSettings";
export { SecretTextConnectionSettings };
