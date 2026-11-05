CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"password_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "college_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_code" text NOT NULL,
	"college_name" text NOT NULL,
	"csi_chapter_name" text NOT NULL,
	"csi_chapter_id" text,
	"city" text NOT NULL,
	"faculty_coordinator_name" text NOT NULL,
	"faculty_coordinator_email" text NOT NULL,
	"faculty_coordinator_contact" text NOT NULL,
	"faculty_accompanying" boolean NOT NULL,
	"total_representatives" integer NOT NULL,
	"chapter_showcase_presenter" text NOT NULL,
	"participating_in_expo" boolean NOT NULL,
	"accommodation_required" boolean NOT NULL,
	"arrival_plan" text,
	"male_accommodation_count" integer DEFAULT 0 NOT NULL,
	"female_accommodation_count" integer DEFAULT 0 NOT NULL,
	"accommodation_participant_names" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"declaration_accepted" boolean NOT NULL,
	"registration_status" text DEFAULT 'submitted' NOT NULL,
	"confirmation_email_sent_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "college_registrations_registration_code_unique" UNIQUE("registration_code"),
	CONSTRAINT "representative_count" CHECK ("college_registrations"."total_representatives" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "expo_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"project_title" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"abstract_storage_provider" text NOT NULL,
	"abstract_storage_key" text NOT NULL,
	"abstract_file_name" text NOT NULL,
	"abstract_mime_type" text NOT NULL,
	"abstract_size_bytes" integer NOT NULL,
	"abstract_sha256" text NOT NULL,
	"review_status" text DEFAULT 'Not Reviewed' NOT NULL,
	"internal_remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expo_projects_registration_id_unique" UNIQUE("registration_id")
);
--> statement-breakpoint
CREATE TABLE "expo_team_members" (
	"project_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	CONSTRAINT "expo_team_members_project_id_participant_id_pk" PRIMARY KEY("project_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"participant_index" integer NOT NULL,
	"full_name" text NOT NULL,
	"department" text NOT NULL,
	"year" integer NOT NULL,
	"contact_number" text NOT NULL,
	"email" text NOT NULL,
	"participant_type" text NOT NULL,
	"is_showcase_presenter" boolean DEFAULT false NOT NULL,
	"requires_accommodation" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expo_projects" ADD CONSTRAINT "expo_projects_registration_id_college_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."college_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expo_team_members" ADD CONSTRAINT "expo_team_members_project_id_expo_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."expo_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expo_team_members" ADD CONSTRAINT "expo_team_members_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_registration_id_college_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."college_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "active_college_coordinator_unique" ON "college_registrations" USING btree (lower(trim("college_name")),lower(trim("faculty_coordinator_email"))) WHERE "college_registrations"."registration_status" <> 'cancelled';