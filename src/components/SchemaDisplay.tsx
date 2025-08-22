import { Badge } from "@/components/ui/badge";

interface SchemaDisplayProps {
	schema: Record<string, unknown>;
	title?: string;
}

interface ParameterInfo {
	name: string;
	type: string;
	description?: string;
	required: boolean;
	defaultValue?: unknown;
}

function parseJsonSchema(jsonSchema: { properties: Record<string, unknown>; required?: string[] }): ParameterInfo[] {
	const parameters: ParameterInfo[] = [];
	const { properties, required = [] } = jsonSchema;

	for (const [key, property] of Object.entries(properties)) {
		if (property && typeof property === 'object') {
			const prop = property as Record<string, unknown>;
			const param: ParameterInfo = {
				name: key,
				type: 'unknown',
				required: required.includes(key),
				description: typeof prop.description === 'string' ? prop.description : undefined,
			};

			// Handle type information
			if (typeof prop.type === 'string') {
				param.type = prop.type;
			} else if (Array.isArray(prop.type)) {
				// Handle union types like ["string", "null"]
				param.type = prop.type.filter(t => t !== 'null').join(' | ') || 'unknown';
			}

			// Handle default values
			if ('default' in prop) {
				param.defaultValue = prop.default;
			}

			// Handle array types
			if (prop.type === 'array' && prop.items && typeof prop.items === 'object') {
				const items = prop.items as Record<string, unknown>;
				if (typeof items.type === 'string') {
					param.type = `array<${items.type}>`;
				}
			}

			// Handle object types  
			if (prop.type === 'object') {
				param.type = 'object';
			}

			// Handle enum types
			if (prop.enum && Array.isArray(prop.enum)) {
				param.type = 'enum';
				param.description = `${param.description || ''} Options: ${prop.enum.join(', ')}`.trim();
			}

			parameters.push(param);
		}
	}

	return parameters;
}

function parseZodSchema(schema: Record<string, unknown>): ParameterInfo[] {
	const parameters: ParameterInfo[] = [];

	try {
		// Handle direct Zod schema objects
		if (schema && typeof schema === 'object') {
			// Check if this is a JSON Schema format
			if ('type' in schema && schema.type === 'object' && 'properties' in schema) {
				return parseJsonSchema(schema as { properties: Record<string, unknown>; required?: string[] });
			}
			
			// Handle Zod schema objects
			// If this is a Zod object schema, iterate through its shape
			const entries = Object.entries(schema);
			
			for (const [key, value] of entries) {
				if (value && typeof value === 'object') {
					const param: ParameterInfo = {
						name: key,
						type: 'unknown',
						required: true,
					};

					// Try to extract information from the Zod schema
					if ('_def' in value) {
						const def = (value as { _def?: unknown })._def as Record<string, unknown>;
						
						// Extract type information
						if (def.typeName && typeof def.typeName === 'string') {
							switch (def.typeName) {
								case 'ZodString':
									param.type = 'string';
									break;
								case 'ZodNumber':
									param.type = 'number';
									break;
								case 'ZodBoolean':
									param.type = 'boolean';
									break;
								case 'ZodArray':
									param.type = 'array';
									break;
								case 'ZodObject':
									param.type = 'object';
									break;
								case 'ZodEnum':
									param.type = 'enum';
									break;
								case 'ZodOptional': {
									param.required = false;
									// Get the inner type for optional values
									const optionalInnerType = def.innerType as Record<string, unknown> | undefined;
									if (optionalInnerType?._def && typeof (optionalInnerType._def as Record<string, unknown>).typeName === 'string') {
										param.type = ((optionalInnerType._def as Record<string, unknown>).typeName as string).replace('Zod', '').toLowerCase();
									}
									break;
								}
								case 'ZodDefault': {
									if (typeof def.defaultValue === 'function') {
										param.defaultValue = (def.defaultValue as () => unknown)();
									}
									// Get the inner type for default values
									const defaultInnerType = def.innerType as Record<string, unknown> | undefined;
									if (defaultInnerType?._def && typeof (defaultInnerType._def as Record<string, unknown>).typeName === 'string') {
										param.type = ((defaultInnerType._def as Record<string, unknown>).typeName as string).replace('Zod', '').toLowerCase();
									}
									break;
								}
								default:
									param.type = def.typeName.replace('Zod', '').toLowerCase();
							}
						}

						// Extract description
						if (def.description && typeof def.description === 'string') {
							param.description = def.description;
						}
					}

					// Check if the value has a describe method result
					if ('description' in value && typeof value.description === 'string') {
						param.description = value.description;
					}

					parameters.push(param);
				}
			}
		}
	} catch (error) {
		console.warn('Failed to parse schema:', error);
	}

	return parameters;
}

function getTypeColor(type: string): string {
	switch (type.toLowerCase()) {
		case 'string':
			return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
		case 'number':
			return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
		case 'boolean':
			return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400';
		case 'array':
			return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400';
		case 'object':
			return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
		case 'enum':
			return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400';
		default:
			return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
	}
}

export function SchemaDisplay({ schema, title = "Parameters" }: SchemaDisplayProps) {
	const parameters = parseZodSchema(schema);

	if (parameters.length === 0) {
		return (
			<div className="text-sm text-muted-foreground">
				No parameters defined for this tool.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h5 className="text-sm font-medium">{title}</h5>
			<div className="space-y-3">
				{parameters.map((param) => (
					<div
						key={param.name}
						className="rounded-md border bg-card p-3 sm:p-4"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<code className="font-mono text-sm font-medium">{param.name}</code>
									<Badge variant="secondary" className={getTypeColor(param.type)}>
										{param.type}
									</Badge>
									<Badge variant={param.required ? "destructive" : "secondary"}>
										{param.required ? "Required" : "Optional"}
									</Badge>
								</div>
							</div>
						</div>
						{(param.description || param.defaultValue !== undefined) && (
							<div className="mt-2 space-y-2">
								{param.description && (
									<p className="text-sm text-muted-foreground">{param.description}</p>
								)}
								{param.defaultValue !== undefined && (
									<div className="text-xs text-muted-foreground">
										Default: {" "}
										<code className="bg-muted px-1 py-0.5 rounded">
											{JSON.stringify(param.defaultValue)}
										</code>
									</div>
								)}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}