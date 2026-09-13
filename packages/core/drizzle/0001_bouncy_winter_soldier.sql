CREATE TYPE "public"."content_status" AS ENUM('draft', 'pending', 'scheduled', 'published', 'trashed');--> statement-breakpoint
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"excerpt" text,
	"content" jsonb NOT NULL,
	"content_html" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"author_id" uuid NOT NULL,
	"featured_media_id" uuid,
	"parent_id" uuid,
	"menu_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_meta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb
);
--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_parent_id_content_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_meta" ADD CONSTRAINT "content_meta_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_type_slug_unique" ON "content" USING btree ("type","slug");--> statement-breakpoint
CREATE INDEX "content_meta_content_id_key_idx" ON "content_meta" USING btree ("content_id","key");