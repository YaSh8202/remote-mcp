import { useFormContext } from "react-hook-form";
import type {
	CustomAuthProperty,
	CustomAuthProps,
} from "@/app/mcp/mcp-app/property";
import { PropertyType } from "@/app/mcp/mcp-app/property";
import type { UpsertCustomAuthRequest } from "@/types/app-connection";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type CustomAuthConnectionSettingsProps = {
	authProperty: CustomAuthProperty<CustomAuthProps>;
};

export const CustomAuthConnectionSettings = ({
	authProperty,
}: CustomAuthConnectionSettingsProps) => {
	const form = useFormContext<{
		request: UpsertCustomAuthRequest;
	}>();

	if (!authProperty.props) {
		return null;
	}

	return (
		<div className="space-y-4">
			{Object.entries(authProperty.props).map(([key, prop]) => {
				const isLongText = prop.type === PropertyType.LONG_TEXT;

				return (
					<FormField
						key={key}
						control={form.control}
						name={`request.value.props.${key}` as const}
						rules={{
							validate: (value) => {
								if (prop.required && (!value || value === "")) {
									return `${prop.displayName} is required`;
								}
								return true;
							},
						}}
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm font-medium">
									{prop.displayName}
									{prop.required && (
										<span className="text-destructive ml-1">*</span>
									)}
								</FormLabel>
								{prop.description && (
									<p className="text-xs text-muted-foreground mb-2">
										{prop.description}
									</p>
								)}
								<FormControl>
									{isLongText ? (
										<Textarea
											{...field}
											placeholder={`Enter ${prop.displayName.toLowerCase()}`}
											className="min-h-[100px]"
											value={(field.value as string) ?? ""}
										/>
									) : (
										<Input
											{...field}
											type="text"
											placeholder={`Enter ${prop.displayName.toLowerCase()}`}
											className="h-11"
											value={(field.value as string) ?? ""}
										/>
									)}
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				);
			})}
		</div>
	);
};
