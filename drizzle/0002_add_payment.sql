ALTER TABLE "college_registrations" ADD COLUMN "payment_category" text DEFAULT 'General' NOT NULL;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_amount" integer DEFAULT 300 NOT NULL;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "has_csi_membership" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "csi_member_id" text;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "csi_member_name" text;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "utr_number" text;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_storage_provider" text;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_storage_key" text;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_file_name" text;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_mime_type" text;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_size_bytes" integer;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_sha256" text;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_status" text DEFAULT 'Submitted for Verification' NOT NULL;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_rejection_reason" text;
--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "payment_verified_at" timestamp with time zone;
--> statement-breakpoint
CREATE UNIQUE INDEX "active_utr_unique" ON "college_registrations" (lower(trim("college_registrations"."utr_number"))) WHERE "college_registrations"."registration_status" <> 'cancelled' AND "college_registrations"."utr_number" IS NOT NULL;
