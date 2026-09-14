DROP INDEX "content_meta_content_id_key_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "content_meta_content_id_key_idx" ON "content_meta" USING btree ("content_id","key");