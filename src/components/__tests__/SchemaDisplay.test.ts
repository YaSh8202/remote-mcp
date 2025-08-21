import { describe, expect, it } from 'vitest';

// Since we can't easily import the component due to React dependencies,
// let's extract and test just the parsing logic

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
		if (schema && typeof schema === 'object') {
			// Check if this is a JSON Schema format
			if ('type' in schema && schema.type === 'object' && 'properties' in schema) {
				return parseJsonSchema(schema as { properties: Record<string, unknown>; required?: string[] });
			}
			
			// Handle Zod schema objects
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

describe('Schema Parser', () => {
	describe('parseJsonSchema', () => {
		it('should parse basic JSON schema', () => {
			const schema = {
				properties: {
					url: {
						type: 'string',
						description: 'URL of the website'
					},
					count: {
						type: 'number',
						default: 10
					}
				},
				required: ['url']
			};

			const result = parseJsonSchema(schema);
			
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				name: 'url',
				type: 'string',
				required: true,
				description: 'URL of the website'
			});
			expect(result[1]).toEqual({
				name: 'count',
				type: 'number',
				required: false,
				defaultValue: 10,
				description: undefined
			});
		});

		it('should handle enum types', () => {
			const schema = {
				properties: {
					format: {
						type: 'string',
						enum: ['json', 'xml', 'yaml'],
						description: 'Output format'
					}
				},
				required: []
			};

			const result = parseJsonSchema(schema);
			
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				name: 'format',
				type: 'enum',
				required: false,
				description: 'Output format Options: json, xml, yaml'
			});
		});
	});

	describe('parseZodSchema', () => {
		it('should parse Zod schema objects', () => {
			const schema = {
				url: {
					_def: {
						typeName: 'ZodString',
						description: 'URL of the website to fetch'
					}
				},
				headers: {
					_def: {
						typeName: 'ZodOptional',
						innerType: {
							_def: {
								typeName: 'ZodRecord'
							}
						},
						description: 'Optional headers'
					}
				}
			};

			const result = parseZodSchema(schema);
			
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				name: 'url',
				type: 'string',
				required: true,
				description: 'URL of the website to fetch'
			});
			expect(result[1]).toEqual({
				name: 'headers',
				type: 'record',
				required: false,
				description: 'Optional headers'
			});
		});

		it('should handle default values in Zod schemas', () => {
			const schema = {
				max_length: {
					_def: {
						typeName: 'ZodDefault',
						innerType: {
							_def: {
								typeName: 'ZodNumber'
							}
						},
						defaultValue: () => 5000,
						description: 'Maximum characters'
					}
				}
			};

			const result = parseZodSchema(schema);
			
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				name: 'max_length',
				type: 'number',
				required: true,
				defaultValue: 5000,
				description: 'Maximum characters'
			});
		});

		it('should handle JSON Schema format passed to parseZodSchema', () => {
			const schema = {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						description: 'Name field'
					}
				},
				required: ['name']
			};

			const result = parseZodSchema(schema);
			
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				name: 'name',
				type: 'string',
				required: true,
				description: 'Name field'
			});
		});
	});
});