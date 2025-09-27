CREATE TABLE "chat_mcp_servers" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_remote_mcp" boolean NOT NULL,
	"mcp_server_id" text,
	"display_name" text,
	"config" jsonb,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"include_all_tools" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_mcp_servers" ADD CONSTRAINT "chat_mcp_servers_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_mcp_servers" ADD CONSTRAINT "chat_mcp_servers_mcp_server_id_mcp_server_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;