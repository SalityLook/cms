CREATE TABLE "reusable_block_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reusable_block_id" uuid NOT NULL,
	"content_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reusable_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reusable_block_usages" ADD CONSTRAINT "reusable_block_usages_reusable_block_id_reusable_blocks_id_fk" FOREIGN KEY ("reusable_block_id") REFERENCES "public"."reusable_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reusable_block_usages" ADD CONSTRAINT "reusable_block_usages_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reusable_blocks" ADD CONSTRAINT "reusable_blocks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reusable_block_usages_unique" ON "reusable_block_usages" USING btree ("reusable_block_id","content_id");