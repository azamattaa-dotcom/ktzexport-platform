CREATE TABLE "buyers" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"country" text NOT NULL,
	"registration_number" text NOT NULL,
	"legal_address" text NOT NULL,
	"postal_address" text NOT NULL,
	"signatory_name" text NOT NULL,
	"signatory_type" text NOT NULL,
	"signatory_custom_type" text,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"website" text,
	"description" text,
	"bank_name" text NOT NULL,
	"swift" text NOT NULL,
	"bank_account" text NOT NULL,
	"bank_currency" text NOT NULL,
	"unloading_region" text NOT NULL,
	"charter_doc" jsonb,
	"registration_doc" jsonb,
	"passport_doc" jsonb,
	"password_hash" text,
	"invite_token" text,
	"status" text NOT NULL,
	"rejection_reason" text,
	"admin_notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"intent" text NOT NULL,
	"product" text,
	"volume" text,
	"contact" text NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"product_id" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_name" text NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"transport_type" text NOT NULL,
	"station_departure" text NOT NULL,
	"station_border" text NOT NULL,
	"station_destination" text NOT NULL,
	"station_empty_return" text,
	"cargo_name" text NOT NULL,
	"cargo_code_gng" text,
	"cargo_code_etsng" text,
	"container_size" text,
	"container_count" text,
	"wagon_count" text,
	"month" text NOT NULL,
	"decade" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_company" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"origin" text NOT NULL,
	"supplier_id" text,
	"supplier_name" text,
	"buyer_id" text,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"country" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"products" text[] NOT NULL,
	"annual_volume" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"elevator_name" text DEFAULT '' NOT NULL,
	"loading_station" text,
	"letterhead_url" text,
	"letterhead_file_name" text,
	"letterhead_base64" text,
	"product_prices" jsonb,
	"product_details" jsonb,
	"status" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"invite_token" text,
	"password_hash" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "buyers_email_idx" ON "buyers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "buyers_status_idx" ON "buyers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "chat_threads_supplier_idx" ON "chat_threads" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "logistics_requests_supplier_idx" ON "logistics_requests" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "logistics_requests_buyer_idx" ON "logistics_requests" USING btree ("buyer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_email_idx" ON "suppliers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "suppliers_status_idx" ON "suppliers" USING btree ("status");