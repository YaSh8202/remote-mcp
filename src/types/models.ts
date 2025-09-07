import { z } from "zod";

export enum LLMProvider {
	OPENAI = "openai",
	ANTHROPIC = "anthropic",
	GOOGLE = "google",
}

export const LLMProviderSchema = z.nativeEnum(LLMProvider);

// Provider schema
export const ProviderSchema = z.object({
	id: LLMProviderSchema,
	displayName: z.string(),
});

// Meta schema for model metadata
export const ModelMetaSchema = z.object({
	id: z.string(),
	provider: LLMProviderSchema,
	family: z.string().optional(),
	name: z.string(),
	displayName: z.string(),
	description: z.string(),
	tags: z.array(z.string()),
});

// Modalities schema
export const ModalitiesSchema = z.object({
	input: z.array(z.string()),
	output: z.array(z.string()),
});

// Supports schema with optional fields
export const SupportsSchema = z.object({
	streaming: z.boolean(),
	systemPrompt: z.boolean(),
	parallelToolCalls: z.boolean(),
	toolChoice: z.string().optional(), // Some models don't have this
	responseFormat: z.array(z.string()).optional(),
});

// Capabilities schema
export const CapabilitiesSchema = z.object({
	modalities: ModalitiesSchema,
	tasks: z.array(z.string()),
	supports: SupportsSchema,
});

// Limits schema
export const LimitsSchema = z.object({
	contextWindow: z.number(),
	maxOutputTokens: z.number(),
});

// Pricing schema
export const PricingSchema = z.object({
	currency: z.string(),
	inputPerMTokUSD: z.number(),
	outputPerMTokUSD: z.number(),
	perRequestUSD: z.number(),
});

// Model schema
export const ModelSchema = z.object({
	meta: ModelMetaSchema,
	capabilities: CapabilitiesSchema,
	limits: LimitsSchema,
	pricing: PricingSchema,
});

// Complete models JSON schema
export const ModelsSchema = z.object({
	providers: z.array(ProviderSchema),
	models: z.array(ModelSchema),
	generatedAt: z.string(),
});

// Export types inferred from schemas
export type Provider = z.infer<typeof ProviderSchema>;
export type ModelMeta = z.infer<typeof ModelMetaSchema>;
export type Modalities = z.infer<typeof ModalitiesSchema>;
export type Supports = z.infer<typeof SupportsSchema>;
export type Capabilities = z.infer<typeof CapabilitiesSchema>;
export type Limits = z.infer<typeof LimitsSchema>;
export type Pricing = z.infer<typeof PricingSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type ModelsData = z.infer<typeof ModelsSchema>;

// Helper function to validate models data
export const validateModelsData = (data: unknown): ModelsData => {
	return ModelsSchema.parse(data);
};

// Helper function to safely parse models data
export const parseModelsData = (
	data: unknown,
):
	| { success: true; data: ModelsData }
	| { success: false; error: z.ZodError } => {
	const result = ModelsSchema.safeParse(data);
	if (result.success) {
		return { success: true, data: result.data };
	}
	return { success: false, error: result.error };
};
