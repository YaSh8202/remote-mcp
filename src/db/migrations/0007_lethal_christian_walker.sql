CREATE TABLE "llm_provider_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"encrypted_key" jsonb NOT NULL,
	"display_name" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"last_validated" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "llm_provider_keys" ADD CONSTRAINT "llm_provider_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;