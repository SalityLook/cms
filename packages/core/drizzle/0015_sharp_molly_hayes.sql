CREATE TABLE "oembed_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"provider_name" varchar(100) NOT NULL,
	"html" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oembed_cache_url_unique" UNIQUE("url")
);
