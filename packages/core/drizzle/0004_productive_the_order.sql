CREATE TABLE "content_seo" (
	"content_id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"description" text,
	"og_image_media_id" uuid,
	"canonical_url" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"structured_data_override" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_seo" ADD CONSTRAINT "content_seo_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;