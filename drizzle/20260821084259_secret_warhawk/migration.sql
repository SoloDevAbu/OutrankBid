ALTER TABLE "startups" DROP CONSTRAINT "startups_website_url_key";--> statement-breakpoint
ALTER TABLE "startups" ADD COLUMN "app_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "startups" DROP COLUMN "website_url";--> statement-breakpoint
ALTER TABLE "startups" ADD CONSTRAINT "startups_app_url_key" UNIQUE("app_url");