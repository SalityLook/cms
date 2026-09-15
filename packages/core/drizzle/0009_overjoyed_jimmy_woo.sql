ALTER TABLE "content" ADD COLUMN "content_text" text;
--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "search_tsv" tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("excerpt", '') || ' ' || coalesce("content_text", ''))) STORED;
--> statement-breakpoint
CREATE INDEX "content_search_tsv_idx" ON "content" USING gin ("search_tsv");