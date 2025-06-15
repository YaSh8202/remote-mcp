CREATE TABLE "mcp_apps" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"app_name" text NOT NULL,
	"server_id" text NOT NULL,
	"tools" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"server_id" text NOT NULL,
	"app_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"status" text NOT NULL,
	"owner_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_server" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"token" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mcp_apps" ADD CONSTRAINT "mcp_apps_server_id_mcp_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_runs" ADD CONSTRAINT "mcp_runs_server_id_mcp_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_runs" ADD CONSTRAINT "mcp_runs_app_id_mcp_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."mcp_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_runs" ADD CONSTRAINT "mcp_runs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server" ADD CONSTRAINT "mcp_server_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;