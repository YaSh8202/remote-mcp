CREATE TABLE "stream_kv" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stream_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"channel" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "active_stream_id" text;--> statement-breakpoint
CREATE INDEX "stream_messages_channel_id_idx" ON "stream_messages" USING btree ("channel","id");