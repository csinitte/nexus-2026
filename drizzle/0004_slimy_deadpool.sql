ALTER TABLE "college_registrations" DROP CONSTRAINT "representative_count";--> statement-breakpoint
DROP INDEX "active_college_coordinator_unique";--> statement-breakpoint
UPDATE "college_registrations" SET "total_representatives" = GREATEST("total_representatives" - 1, 1) WHERE "faculty_accompanying" = true;--> statement-breakpoint
ALTER TABLE "college_registrations" ADD CONSTRAINT "representative_count" CHECK ("college_registrations"."total_representatives" > 0);