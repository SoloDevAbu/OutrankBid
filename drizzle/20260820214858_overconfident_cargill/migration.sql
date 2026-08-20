CREATE TYPE "payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "startup_status" AS ENUM('pending', 'active', 'paused', 'removed');--> statement-breakpoint
CREATE TABLE "bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"startup_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "click_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"startup_id" uuid NOT NULL,
	"referrer" text,
	"user_agent" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"bid_id" uuid NOT NULL UNIQUE,
	"provider" text NOT NULL,
	"provider_payment_id" text NOT NULL UNIQUE,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "payment_status" DEFAULT 'pending'::"payment_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "startups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" text NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"website_url" text NOT NULL,
	"description" text,
	"logo_url" text,
	"current_bid" integer DEFAULT 0 NOT NULL,
	"status" "startup_status" DEFAULT 'pending'::"startup_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bids_startup_id_idx" ON "bids" ("startup_id");--> statement-breakpoint
CREATE INDEX "bids_user_id_idx" ON "bids" ("user_id");--> statement-breakpoint
CREATE INDEX "bids_created_at_idx" ON "bids" ("created_at");--> statement-breakpoint
CREATE INDEX "click_events_startup_id_idx" ON "click_events" ("startup_id");--> statement-breakpoint
CREATE INDEX "click_events_created_at_idx" ON "click_events" ("created_at");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" ("status");--> statement-breakpoint
CREATE INDEX "startups_status_current_bid_idx" ON "startups" ("status","current_bid" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "startups_status_category_current_bid_idx" ON "startups" ("status","category_id","current_bid" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "startups_owner_id_idx" ON "startups" ("owner_id");--> statement-breakpoint
CREATE INDEX "startups_category_id_idx" ON "startups" ("category_id");--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_startup_id_startups_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "startups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_startup_id_startups_id_fkey" FOREIGN KEY ("startup_id") REFERENCES "startups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bid_id_bids_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "startups" ADD CONSTRAINT "startups_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;