import { KeyRound } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod/v4";
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
					<FormItem className="space-y-3">
						<FormLabel className="text-sm font-medium flex items-center gap-2">
							<KeyRound className="w-4 h-4" />
							{authProperty.displayName}
						</FormLabel>
						<FormControl>
							<div className="relative">
								<Input
									{...field}
									type="password"
									className="h-11 pr-10"
									placeholder="Enter your secret key or token"
								/>
							</div>
						</FormControl>
						<FormMessage />
						<p className="text-xs text-muted-foreground">
							This information is encrypted and securely stored.
						</p>
					</FormItem>
				)}
			/>
		);
	},
);

SecretTextConnectionSettings.displayName = "SecretTextConnectionSettings";
export { SecretTextConnectionSettings };
