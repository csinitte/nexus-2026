ALTER TABLE "college_registrations" ALTER COLUMN "csi_chapter_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "college_registrations" ALTER COLUMN "faculty_coordinator_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "college_registrations" ALTER COLUMN "faculty_coordinator_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "college_registrations" ALTER COLUMN "faculty_coordinator_contact" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "college_registrations" ALTER COLUMN "faculty_accompanying" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "college_registrations" ALTER COLUMN "chapter_showcase_presenter" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "college_registrations" ALTER COLUMN "participating_in_expo" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "college_registrations" ALTER COLUMN "accommodation_required" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "college_registrations" ADD COLUMN "college_category" text DEFAULT 'no_active_csi' NOT NULL;