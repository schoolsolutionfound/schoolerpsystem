CREATE TABLE "attendance_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"attendance_record_id" text NOT NULL,
	"student_id" text NOT NULL,
	"attendance_status" varchar(20) DEFAULT 'present' NOT NULL,
	"remarks" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"timetable_slot_id" text NOT NULL,
	"date" date NOT NULL,
	"taken_by_teacher_id" text NOT NULL,
	"status" varchar(20) DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp DEFAULT now(),
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "class_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"department" varchar(200) DEFAULT '',
	"academic_year" varchar(100) DEFAULT '',
	"section" varchar(50) DEFAULT '',
	"class_teacher_id" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drive_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"drive_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" varchar(20) DEFAULT 'applied' NOT NULL,
	"profile_snapshot" jsonb NOT NULL,
	"resume_url" text NOT NULL,
	"applied_at" timestamp DEFAULT now(),
	"withdrawn_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exam_subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"subject_id" text NOT NULL,
	"max_marks" integer DEFAULT 100 NOT NULL,
	"pass_marks" integer DEFAULT 35 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"term" varchar(100) DEFAULT '',
	"academic_year" varchar(50) DEFAULT '',
	"start_date" date,
	"end_date" date,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fee_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"fee_structure_id" text NOT NULL,
	"student_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(30) DEFAULT 'upi' NOT NULL,
	"payment_date" date,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"receipt_no" varchar(50),
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fee_structures" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"class_section_id" text,
	"title" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'student_fee' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"term" varchar(100),
	"academic_year" varchar(20),
	"due_date" date,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "homework" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"class_section_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text DEFAULT '',
	"due_date" date NOT NULL,
	"assigned_date" date DEFAULT '2024-01-01' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"institution_name" text NOT NULL,
	"institution_type" varchar(50) DEFAULT 'college' NOT NULL,
	"subscription_status" varchar(50) DEFAULT 'active' NOT NULL,
	"departments" jsonb DEFAULT '[]'::jsonb,
	"academic_years" jsonb DEFAULT '[]'::jsonb,
	"courses" jsonb DEFAULT '[]'::jsonb,
	"terms" jsonb DEFAULT '[]'::jsonb,
	"blocked_dates" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "institutions_institution_code_unique" UNIQUE("institution_code")
);
--> statement-breakpoint
CREATE TABLE "marks" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"exam_subject_id" text NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"class_section_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"marks_obtained" numeric(6, 2) DEFAULT '0' NOT NULL,
	"grade" varchar(5) DEFAULT '',
	"remarks" text DEFAULT '',
	"entered_by" text NOT NULL,
	"entered_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "periods" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"label" varchar(100) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "placement_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"drive_id" text,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"attachment_url" text DEFAULT '',
	"target_branches" jsonb DEFAULT '[]'::jsonb,
	"target_years" jsonb DEFAULT '[]'::jsonb,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"posted_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "placement_drives" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"logo_url" text DEFAULT '',
	"banner_url" text DEFAULT '',
	"title" varchar(200) NOT NULL,
	"description" text DEFAULT '',
	"job_type" varchar(50) DEFAULT 'full_time' NOT NULL,
	"ctc_or_stipend" varchar(100) DEFAULT '',
	"location" varchar(200) DEFAULT '',
	"rounds" jsonb DEFAULT '[]'::jsonb,
	"allowed_branches" jsonb DEFAULT '[]'::jsonb,
	"allowed_years" jsonb DEFAULT '[]'::jsonb,
	"min_cgpa" numeric(4, 2),
	"max_backlogs" integer,
	"apply_deadline" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "placement_members" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"user_id" text NOT NULL,
	"access_level" varchar(20) DEFAULT 'member' NOT NULL,
	"granted_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_classes" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"class_section_id" text NOT NULL,
	"roll_no" varchar(50) DEFAULT '',
	"academic_year" varchar(50) DEFAULT '',
	"effective_from" date DEFAULT '2024-01-01' NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"file_name" text DEFAULT '',
	"file_url" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_placement_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" varchar(20) DEFAULT '',
	"email" varchar(255) NOT NULL,
	"photo_url" text DEFAULT '',
	"resume_url" text DEFAULT '',
	"cgpa" numeric(4, 2),
	"tenth_percent" numeric(5, 2),
	"twelfth_or_diploma_percent" numeric(5, 2),
	"active_backlogs" integer DEFAULT 0,
	"portfolio_url" text DEFAULT '',
	"linkedin_url" text DEFAULT '',
	"github_url" text DEFAULT '',
	"leetcode_url" text DEFAULT '',
	"other_links" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "student_placement_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "subject_teachers" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"class_section_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(50) DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timetable_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"timetable_id" text NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"class_section_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"period_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"room" varchar(100) DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timetables" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"class_section_id" text NOT NULL,
	"academic_year" varchar(100) DEFAULT '',
	"term" varchar(100) DEFAULT '',
	"version" integer DEFAULT 1 NOT NULL,
	"effective_from" date NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "institution_code" varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "institution_name" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "title" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "scope" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permissions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "graduated_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_attendance_entries_record" ON "attendance_entries" USING btree ("attendance_record_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_entries_student" ON "attendance_entries" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attendance_entries_record_student" ON "attendance_entries" USING btree ("attendance_record_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_records_inst" ON "attendance_records" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_attendance_records_slot" ON "attendance_records" USING btree ("timetable_slot_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_records_teacher" ON "attendance_records" USING btree ("taken_by_teacher_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_records_date" ON "attendance_records" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attendance_records_slot_date" ON "attendance_records" USING btree ("timetable_slot_id","date");--> statement-breakpoint
CREATE INDEX "idx_class_sections_inst" ON "class_sections" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_class_sections_teacher" ON "class_sections" USING btree ("class_teacher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_class_sections_inst_name" ON "class_sections" USING btree ("institution_code","name");--> statement-breakpoint
CREATE INDEX "idx_drive_applications_drive" ON "drive_applications" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_drive_applications_student" ON "drive_applications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_drive_applications_status" ON "drive_applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_drive_applications_drive_student" ON "drive_applications" USING btree ("drive_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_exam_subjects_exam" ON "exam_subjects" USING btree ("exam_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_exam_subjects_exam_subject" ON "exam_subjects" USING btree ("exam_id","subject_id");--> statement-breakpoint
CREATE INDEX "idx_exams_inst" ON "exams" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_exams_status" ON "exams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fee_payments_inst" ON "fee_payments" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_fee_payments_student" ON "fee_payments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_fee_payments_fee_structure" ON "fee_payments" USING btree ("fee_structure_id");--> statement-breakpoint
CREATE INDEX "idx_fee_payments_status" ON "fee_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fee_structures_inst" ON "fee_structures" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_fee_structures_class" ON "fee_structures" USING btree ("class_section_id");--> statement-breakpoint
CREATE INDEX "idx_fee_structures_category" ON "fee_structures" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_homework_inst" ON "homework" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_homework_class" ON "homework" USING btree ("class_section_id");--> statement-breakpoint
CREATE INDEX "idx_homework_teacher" ON "homework" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_homework_subject" ON "homework" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_homework_due_date" ON "homework" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_marks_exam" ON "marks" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_marks_student" ON "marks" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_marks_class" ON "marks" USING btree ("class_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_marks_exam_subject_student" ON "marks" USING btree ("exam_subject_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_periods_inst" ON "periods" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_placement_announcements_inst" ON "placement_announcements" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_placement_announcements_drive" ON "placement_announcements" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_placement_drives_inst" ON "placement_drives" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_placement_drives_status" ON "placement_drives" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_placement_members_inst" ON "placement_members" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_placement_members_user" ON "placement_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_placement_members_inst_user" ON "placement_members" USING btree ("institution_code","user_id");--> statement-breakpoint
CREATE INDEX "idx_student_classes_inst" ON "student_classes" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_student_classes_student" ON "student_classes" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_classes_class" ON "student_classes" USING btree ("class_section_id");--> statement-breakpoint
CREATE INDEX "idx_student_classes_active_student" ON "student_classes" USING btree ("student_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_student_classes_class_student_year" ON "student_classes" USING btree ("class_section_id","student_id","academic_year");--> statement-breakpoint
CREATE INDEX "idx_student_documents_inst" ON "student_documents" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_student_documents_student" ON "student_documents" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_subject_teachers_inst" ON "subject_teachers" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_subject_teachers_class" ON "subject_teachers" USING btree ("class_section_id");--> statement-breakpoint
CREATE INDEX "idx_subject_teachers_teacher" ON "subject_teachers" USING btree ("teacher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_subject_teachers_class_subject" ON "subject_teachers" USING btree ("class_section_id","subject_id");--> statement-breakpoint
CREATE INDEX "idx_subjects_inst" ON "subjects" USING btree ("institution_code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_subjects_inst_name" ON "subjects" USING btree ("institution_code","name");--> statement-breakpoint
CREATE INDEX "idx_timetable_slots_tt" ON "timetable_slots" USING btree ("timetable_id");--> statement-breakpoint
CREATE INDEX "idx_timetable_slots_teacher" ON "timetable_slots" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_timetable_slots_class" ON "timetable_slots" USING btree ("class_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_timetable_slots_tt_day_period" ON "timetable_slots" USING btree ("timetable_id","day_of_week","period_id");--> statement-breakpoint
CREATE INDEX "idx_timetables_inst" ON "timetables" USING btree ("institution_code");--> statement-breakpoint
CREATE INDEX "idx_timetables_class" ON "timetables" USING btree ("class_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_timetables_class_version" ON "timetables" USING btree ("class_section_id","version");--> statement-breakpoint
CREATE INDEX "idx_users_institution_code" ON "users" USING btree ("institution_code");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "school_code";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "school_name";