-- Full schema baseline for an empty PostgreSQL database.
-- Generated from src/modules/shared/db/schema.ts.
-- Idempotent DDL, but db:bootstrap refuses to run on a non-empty public schema.
CREATE TABLE IF NOT EXISTS "academic_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_date" varchar(20) DEFAULT '',
	"end_date" varchar(20) DEFAULT '',
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admission_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"academic_year" varchar(50) NOT NULL,
	"application_number" varchar(50) NOT NULL,
	"full_name" text NOT NULL,
	"parent_phone" varchar(20) DEFAULT '' NOT NULL,
	"dob" varchar(20) DEFAULT '',
	"father_name" text DEFAULT '',
	"mother_name" text DEFAULT '',
	"guardian_phone" varchar(20) DEFAULT '',
	"address" text DEFAULT '',
	"blood_group" varchar(10) DEFAULT '',
	"program_type" varchar(50) DEFAULT 'engineering',
	"preferred_course_id" text,
	"preferred_course_name" text DEFAULT '',
	"status" varchar(30) DEFAULT 'waiting_list' NOT NULL,
	"allocated_course_id" text,
	"allocated_course_name" text DEFAULT '',
	"allocated_quota" varchar(50) DEFAULT '',
	"allocated_at" timestamp,
	"confirmed_at" timestamp,
	"notes" text DEFAULT '',
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_by" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admission_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"academic_year" varchar(50) NOT NULL,
	"course_code" varchar(50) NOT NULL,
	"course_name" text NOT NULL,
	"program_type" varchar(50) DEFAULT 'engineering' NOT NULL,
	"total_seats" integer DEFAULT 0 NOT NULL,
	"quotas" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admission_form_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"program_type" varchar(50) DEFAULT 'all' NOT NULL,
	"field_key" varchar(100) NOT NULL,
	"label" text NOT NULL,
	"field_type" varchar(50) DEFAULT 'text' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb,
	"placeholder" text DEFAULT '',
	"is_required" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admissions" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"parent_name" text DEFAULT '',
	"parent_email" text DEFAULT '',
	"parent_phone" text DEFAULT '',
	"school_id" text NOT NULL,
	"school_name" text DEFAULT '',
	"child_full_name" text NOT NULL,
	"child_age" integer NOT NULL,
	"child_gender" varchar(20) DEFAULT 'male' NOT NULL,
	"previous_school" text DEFAULT '',
	"grade_applying_for" varchar(50) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"entrance_test_date" timestamp,
	"entrance_test_venue" text DEFAULT '',
	"entrance_test_instructions" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcement_reads" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcement_targets" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"target_type" varchar(50) DEFAULT 'all' NOT NULL,
	"target_role" varchar(50) DEFAULT '',
	"class_id" text DEFAULT '',
	"section_id" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"title" varchar(300) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) DEFAULT 'GENERAL' NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"created_by" text NOT NULL,
	"publish_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"image_url" text DEFAULT '',
	"attachment_url" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendance_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"attendance_record_id" text NOT NULL,
	"student_id" text NOT NULL,
	"attendance_status" varchar(20) DEFAULT 'present' NOT NULL,
	"remarks" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendance_records" (
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
CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"target_type" varchar(50) DEFAULT 'platform' NOT NULL,
	"target_id" text,
	"target_label" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_locations" (
	"trip_id" text PRIMARY KEY NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"speed" numeric(5, 2),
	"heading" numeric(5, 2),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"vehicle_id" text,
	"driver_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_stops" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"route_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_trips" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"route_id" text NOT NULL,
	"driver_id" text NOT NULL,
	"trip_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'live' NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"registration_no" varchar(50) NOT NULL,
	"capacity" integer DEFAULT 30 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "class_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"department" varchar(200) DEFAULT '',
	"academic_year" varchar(100) DEFAULT '',
	"section" varchar(50) DEFAULT '',
	"class_teacher_id" text DEFAULT '',
	"session_id" varchar(100) DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "counseling_records" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"student_name" varchar(200) NOT NULL,
	"grade_section" varchar(100) DEFAULT '',
	"counselor_id" text NOT NULL,
	"counselor_name" varchar(200) NOT NULL,
	"concern_category" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"action_plan" text DEFAULT '',
	"parent_contacted" boolean DEFAULT false,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"date" date NOT NULL,
	"last_follow_up_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "department_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"department" varchar(100) NOT NULL,
	"semester" varchar(50) NOT NULL,
	"batch_year" varchar(50) DEFAULT '',
	"type" varchar(30) DEFAULT 'theory' NOT NULL,
	"credits" integer DEFAULT 3 NOT NULL,
	"instructor_id" text DEFAULT '',
	"instructor_name" varchar(200) DEFAULT '',
	"instructor_rank" varchar(50) DEFAULT '',
	"enrolled_students_count" integer DEFAULT 0,
	"total_planned_hours" integer DEFAULT 45,
	"completed_hours" integer DEFAULT 0,
	"syllabus_progress_pct" integer DEFAULT 0,
	"lab_batches_count" integer DEFAULT 1,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drive_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"drive_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" varchar(20) DEFAULT 'applied' NOT NULL,
	"current_round_index" integer DEFAULT 0 NOT NULL,
	"profile_snapshot" jsonb NOT NULL,
	"resume_url" text NOT NULL,
	"applied_at" timestamp DEFAULT now(),
	"withdrawn_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_suppressions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"reason" varchar(20) DEFAULT 'bounce' NOT NULL,
	"ses_event_id" varchar(128) DEFAULT '',
	"detail" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"firebase_uid" text DEFAULT '',
	"token_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_eligibility" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"student_name" varchar(200) NOT NULL,
	"usn" varchar(50) NOT NULL,
	"semester" varchar(50) NOT NULL,
	"department" varchar(100) NOT NULL,
	"overall_attendance_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"courses_below_threshold" integer DEFAULT 0,
	"internal_assessment_score" numeric(5, 2) DEFAULT '0',
	"hall_ticket_status" varchar(30) DEFAULT 'detained' NOT NULL,
	"condonation_reason" text DEFAULT '',
	"approved_by" text DEFAULT '',
	"approval_date" date,
	"remarks" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"subject_id" text NOT NULL,
	"max_marks" integer DEFAULT 100 NOT NULL,
	"pass_marks" integer DEFAULT 35 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"term" varchar(100) DEFAULT '',
	"academic_year" varchar(50) DEFAULT '',
	"session_id" varchar(100) DEFAULT '',
	"start_date" date,
	"end_date" date,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expense_records" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'other' NOT NULL,
	"payee_name" varchar(255) NOT NULL,
	"employee_id" varchar(100),
	"designation" varchar(100),
	"department" varchar(100),
	"vehicle_no" varchar(50),
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(30) DEFAULT 'bank_transfer' NOT NULL,
	"payment_date" date,
	"status" varchar(20) DEFAULT 'paid' NOT NULL,
	"invoice_no" varchar(50),
	"notes" text,
	"created_by" text,
	"schedule_id" varchar(64),
	"user_id" varchar(128),
	"period_key" varchar(64),
	"due_date" date,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payroll_type" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fee_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"fee_structure_id" text NOT NULL,
	"student_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(30) DEFAULT 'upi' NOT NULL,
	"payment_date" date,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"receipt_no" varchar(50),
	"payment_order_id" text,
	"gateway_payment_id" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fee_structures" (
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
CREATE TABLE IF NOT EXISTS "homework" (
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
CREATE TABLE IF NOT EXISTS "institution_email_config" (
	"institution_code" varchar(100) PRIMARY KEY NOT NULL,
	"from_email" varchar(255) NOT NULL,
	"from_name" varchar(200) DEFAULT '' NOT NULL,
	"reply_to" varchar(255) DEFAULT '',
	"configuration_set" varchar(128) DEFAULT '',
	"domain" varchar(255) DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institution_payment_config" (
	"institution_code" varchar(100) PRIMARY KEY NOT NULL,
	"gateway" varchar(30) DEFAULT 'razorpay' NOT NULL,
	"key_id" varchar(255) NOT NULL,
	"key_secret_enc" text NOT NULL,
	"webhook_secret_enc" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"institution_name" text NOT NULL,
	"institution_type" varchar(50) DEFAULT 'school' NOT NULL,
	"subscription_status" varchar(50) DEFAULT 'active' NOT NULL,
	"departments" jsonb DEFAULT '[]'::jsonb,
	"academic_years" jsonb DEFAULT '[]'::jsonb,
	"years_of_study" jsonb DEFAULT '[]'::jsonb,
	"courses" jsonb DEFAULT '[]'::jsonb,
	"sections" jsonb DEFAULT '[]'::jsonb,
	"class_subjects" jsonb DEFAULT '{}'::jsonb,
	"terms" jsonb DEFAULT '[]'::jsonb,
	"blocked_dates" jsonb DEFAULT '[]'::jsonb,
	"profile_form_fields" jsonb DEFAULT '{}'::jsonb,
	"default_temp_password" varchar(64) DEFAULT '',
	"maintenance_enabled" boolean DEFAULT false NOT NULL,
	"maintenance_min_version" varchar(50) DEFAULT '0.0.0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "institutions_institution_code_unique" UNIQUE("institution_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_authors" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"bio" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_book_copies" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"book_id" text NOT NULL,
	"accession_number" varchar(100) NOT NULL,
	"barcode" varchar(100) NOT NULL,
	"rack" varchar(100) DEFAULT 'Rack A',
	"shelf" varchar(100) DEFAULT 'Shelf 1',
	"status" varchar(50) DEFAULT 'AVAILABLE' NOT NULL,
	"condition" varchar(50) DEFAULT 'GOOD' NOT NULL,
	"added_at" date DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_books" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"isbn" varchar(100) NOT NULL,
	"publisher" varchar(200) DEFAULT '',
	"edition" varchar(100) DEFAULT '',
	"publication_year" integer,
	"language" varchar(50) DEFAULT 'English' NOT NULL,
	"category_id" text NOT NULL,
	"subject" varchar(200) DEFAULT '',
	"description" text DEFAULT '',
	"book_type" varchar(50) DEFAULT 'TEXTBOOK' NOT NULL,
	"cover_image" text DEFAULT '',
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"author_ids" jsonb DEFAULT '[]'::jsonb,
	"price" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text DEFAULT '',
	"parent_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_fines" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"loan_id" text,
	"book_copy_id" text,
	"student_id" text NOT NULL,
	"fine_type" varchar(50) NOT NULL,
	"damage_type" varchar(50),
	"damage_notes" text DEFAULT '',
	"amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(50) DEFAULT 'UNPAID' NOT NULL,
	"waived_by" text,
	"waived_reason" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_loans" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"copy_id" text NOT NULL,
	"book_id" text NOT NULL,
	"student_id" text NOT NULL,
	"issued_by" text NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"return_date" date,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"renewal_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_payment_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"fine_id" text NOT NULL,
	"receipt_no" varchar(100) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"cash_tendered" numeric(10, 2),
	"change_returned" numeric(10, 2),
	"transaction_ref" text DEFAULT '',
	"scanned_qr_payload" text DEFAULT '',
	"paid_at" timestamp DEFAULT now(),
	"cashier" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_question_papers" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"subject" varchar(200) NOT NULL,
	"academic_year" varchar(50) NOT NULL,
	"exam_type" varchar(50) NOT NULL,
	"class_grade" varchar(50) NOT NULL,
	"total_marks" integer DEFAULT 100 NOT NULL,
	"duration_minutes" integer DEFAULT 180 NOT NULL,
	"file_url" text DEFAULT '',
	"file_size" varchar(50),
	"downloads_count" integer DEFAULT 0 NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"book_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" varchar(50) DEFAULT 'WAITING' NOT NULL,
	"reserved_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"borrowing_limit" integer DEFAULT 3 NOT NULL,
	"loan_period_days" integer DEFAULT 14 NOT NULL,
	"grace_period_days" integer DEFAULT 2 NOT NULL,
	"fine_per_day" numeric(8, 2) DEFAULT '1.00' NOT NULL,
	"max_fine" numeric(8, 2) DEFAULT '100.00' NOT NULL,
	"renewal_limit" integer DEFAULT 2 NOT NULL,
	"allow_reservation" boolean DEFAULT true NOT NULL,
	"lost_book_penalty" numeric(8, 2) DEFAULT '50.00' NOT NULL,
	"damaged_book_penalty" numeric(8, 2) DEFAULT '25.00' NOT NULL,
	"reservation_expiry_days" integer DEFAULT 7 NOT NULL,
	"unpaid_fine_lock_threshold" numeric(8, 2) DEFAULT '20.00' NOT NULL,
	"opening_hours" varchar(50) DEFAULT '08:00 AM',
	"closing_hours" varchar(50) DEFAULT '06:00 PM',
	"open_on_weekends" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marks" (
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
CREATE TABLE IF NOT EXISTS "notification_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"notification_id" text,
	"campaign_id" text,
	"user_id" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"title" varchar(300) NOT NULL,
	"body" text NOT NULL,
	"type" varchar(50) DEFAULT 'announcement' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"channel" varchar(20) DEFAULT 'push' NOT NULL,
	"target" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scheduled_at" timestamp,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"user_id" text NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"disabled_types" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"channel" varchar(20) DEFAULT 'push' NOT NULL,
	"title_template" varchar(300) NOT NULL,
	"body_template" text NOT NULL,
	"locale" varchar(10) DEFAULT 'en' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"recipient_id" text NOT NULL,
	"title" varchar(300) NOT NULL,
	"body" text NOT NULL,
	"type" varchar(50) DEFAULT 'general' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"channel" varchar(20) DEFAULT 'push' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"read_at" timestamp,
	"sent_at" timestamp,
	"failed_at" timestamp,
	"error_message" text DEFAULT '',
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parent_links" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"parent_id" text NOT NULL,
	"student_id" text NOT NULL,
	"relationship" varchar(50) DEFAULT '',
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"payer_uid" text NOT NULL,
	"payer_role" varchar(30) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"amount_paise" bigint NOT NULL,
	"status" varchar(30) DEFAULT 'created' NOT NULL,
	"gateway" varchar(30) DEFAULT 'razorpay' NOT NULL,
	"gateway_order_id" text,
	"gateway_payment_id" text,
	"method" varchar(30),
	"fee_structure_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"paid_at" timestamp,
	"refunded_paise" bigint DEFAULT 0 NOT NULL,
	"webhook_event_id" text,
	"failure_reason" text,
	"gateway_callback" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_receipt_sequences" (
	"institution_code" varchar(100) PRIMARY KEY NOT NULL,
	"period" varchar(20) DEFAULT 'YYYYMM' NOT NULL,
	"next_seq" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"payment_order_id" text NOT NULL,
	"gateway" varchar(30) DEFAULT 'razorpay' NOT NULL,
	"gateway_payment_id" text,
	"gateway_refund_id" text,
	"amount_paise" bigint NOT NULL,
	"method" varchar(30),
	"status" varchar(30) DEFAULT 'initiated' NOT NULL,
	"failure_code" varchar(50),
	"failure_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payroll_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"payee_name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT '' NOT NULL,
	"department" varchar(100),
	"amount" numeric(12, 2) NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"day_of_month" integer,
	"days_of_month" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weekday" integer,
	"start_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"last_generated_key" varchar(32),
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "periods" (
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
CREATE TABLE IF NOT EXISTS "placement_announcements" (
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
CREATE TABLE IF NOT EXISTS "placement_drives" (
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
CREATE TABLE IF NOT EXISTS "placement_members" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"user_id" text NOT NULL,
	"access_level" varchar(20) DEFAULT 'member' NOT NULL,
	"granted_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"token" text NOT NULL,
	"platform" varchar(20) NOT NULL,
	"device_name" varchar(200) DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "push_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_notices" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"title" varchar(300) NOT NULL,
	"content" text NOT NULL,
	"target_audience" varchar(50) DEFAULT 'all' NOT NULL,
	"department" varchar(100) DEFAULT '',
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_role" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_classes" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"class_section_id" text NOT NULL,
	"roll_no" varchar(50) DEFAULT '',
	"academic_year" varchar(50) DEFAULT '',
	"session_id" varchar(100) DEFAULT '',
	"effective_from" date DEFAULT '2024-01-01' NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"file_name" text DEFAULT '',
	"file_url" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_placement_profiles" (
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
CREATE TABLE IF NOT EXISTS "student_transport" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"student_id" text NOT NULL,
	"route_id" text NOT NULL,
	"stop_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subject_teachers" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"class_section_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(50) DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "timetable_slots" (
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
CREATE TABLE IF NOT EXISTS "timetables" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"class_section_id" text NOT NULL,
	"academic_year" varchar(100) DEFAULT '',
	"term" varchar(100) DEFAULT '',
	"version" integer DEFAULT 1 NOT NULL,
	"effective_from" date NOT NULL,
	"created_by" text NOT NULL,
	"session_id" varchar(100) DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"firebase_uid" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" text NOT NULL,
	"role" varchar(50) DEFAULT 'student' NOT NULL,
	"institution_code" varchar(100) DEFAULT '',
	"institution_name" text DEFAULT '',
	"institution_type" varchar(50) DEFAULT 'school',
	"roll_no_usn" varchar(100) DEFAULT '',
	"must_change_password" boolean DEFAULT false,
	"profile_completed" boolean DEFAULT false,
	"email_verified" boolean DEFAULT true NOT NULL,
	"email_verified_at" timestamp,
	"parent_phone" varchar(20) DEFAULT '',
	"student_phone" varchar(20) DEFAULT '',
	"profile_pic_url" text DEFAULT '',
	"dob" varchar(20) DEFAULT '',
	"gender" varchar(20) DEFAULT '',
	"admission_no" varchar(100) DEFAULT '',
	"admission_date" varchar(20) DEFAULT '',
	"address" text DEFAULT '',
	"city" varchar(100) DEFAULT '',
	"pincode" varchar(10) DEFAULT '',
	"guardian_name" varchar(200) DEFAULT '',
	"guardian_relation" varchar(50) DEFAULT '',
	"guardian_email" varchar(255) DEFAULT '',
	"tenth_percentage" varchar(10) DEFAULT '',
	"twelfth_percentage" varchar(10) DEFAULT '',
	"alternate_phone" varchar(20) DEFAULT '',
	"occupation" varchar(120) DEFAULT '',
	"emergency_contact" varchar(255) DEFAULT '',
	"preferred_language" varchar(50) DEFAULT '',
	"title" text DEFAULT '',
	"scope" jsonb DEFAULT '{}'::jsonb,
	"roles" jsonb DEFAULT '[]'::jsonb,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"graduated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_academic_sessions_inst" ON "academic_sessions" USING btree ("institution_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_academic_sessions_inst_name" ON "academic_sessions" USING btree ("institution_code","name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admission_apps_inst" ON "admission_applications" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admission_apps_status" ON "admission_applications" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admission_apps_batch" ON "admission_applications" USING btree ("academic_year");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_admission_apps_inst_no" ON "admission_applications" USING btree ("institution_code","application_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admission_courses_inst" ON "admission_courses" USING btree ("institution_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_admission_courses_inst_year_code" ON "admission_courses" USING btree ("institution_code","academic_year","course_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_admission_courses_inst_id" ON "admission_courses" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admission_form_configs_inst" ON "admission_form_configs" USING btree ("institution_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_admission_form_configs_inst_prog_key" ON "admission_form_configs" USING btree ("institution_code","program_type","field_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admissions_parent" ON "admissions" USING btree ("parent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admissions_school" ON "admissions" USING btree ("school_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admissions_status" ON "admissions" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcement_reads_announcement_id" ON "announcement_reads" USING btree ("announcement_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcement_reads_user_id" ON "announcement_reads" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_announcement_reads_ann_user" ON "announcement_reads" USING btree ("announcement_id","user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcement_targets_announcement_id" ON "announcement_targets" USING btree ("announcement_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcement_targets_target_role" ON "announcement_targets" USING btree ("target_role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcement_targets_class_id" ON "announcement_targets" USING btree ("class_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcement_targets_section_id" ON "announcement_targets" USING btree ("section_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_institution_code" ON "announcements" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_status" ON "announcements" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_type" ON "announcements" USING btree ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_priority" ON "announcements" USING btree ("priority");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_created_by" ON "announcements" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_publish_at" ON "announcements" USING btree ("publish_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_expires_at" ON "announcements" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_entries_record" ON "attendance_entries" USING btree ("attendance_record_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_entries_student" ON "attendance_entries" USING btree ("student_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_attendance_entries_record_student" ON "attendance_entries" USING btree ("attendance_record_id","student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_records_inst" ON "attendance_records" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_records_slot" ON "attendance_records" USING btree ("timetable_slot_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_records_teacher" ON "attendance_records" USING btree ("taken_by_teacher_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_records_date" ON "attendance_records" USING btree ("date");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_attendance_records_slot_date" ON "attendance_records" USING btree ("timetable_slot_id","date");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_attendance_records_inst_id" ON "attendance_records" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_events_created_at" ON "audit_events" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bus_routes_driver" ON "bus_routes" USING btree ("driver_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_bus_routes_inst_id" ON "bus_routes" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bus_stops_route_seq" ON "bus_stops" USING btree ("route_id","sequence");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_bus_stops_inst_id" ON "bus_stops" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_bus_trips_live_driver" ON "bus_trips" USING btree ("driver_id") WHERE status = 'live';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bus_trips_live_route" ON "bus_trips" USING btree ("route_id") WHERE status = 'live';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_bus_vehicles_inst_reg" ON "bus_vehicles" USING btree ("institution_code","registration_no");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_bus_vehicles_inst_id" ON "bus_vehicles" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_class_sections_inst" ON "class_sections" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_class_sections_teacher" ON "class_sections" USING btree ("class_teacher_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_class_sections_inst_name" ON "class_sections" USING btree ("institution_code","name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_class_sections_inst_id" ON "class_sections" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_counseling_inst" ON "counseling_records" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_counseling_student" ON "counseling_records" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_counseling_counselor" ON "counseling_records" USING btree ("counselor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_counseling_status" ON "counseling_records" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dept_courses_inst_dept" ON "department_courses" USING btree ("institution_code","department");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dept_courses_instructor" ON "department_courses" USING btree ("instructor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_drive_applications_drive" ON "drive_applications" USING btree ("drive_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_drive_applications_student" ON "drive_applications" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_drive_applications_status" ON "drive_applications" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_drive_applications_drive_student" ON "drive_applications" USING btree ("drive_id","student_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_sup_email_inst" ON "email_suppressions" USING btree ("institution_code","email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sup_email" ON "email_suppressions" USING btree ("email");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_evt_token_hash" ON "email_verification_tokens" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evt_email_sent" ON "email_verification_tokens" USING btree ("email","sent_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evt_expires" ON "email_verification_tokens" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_exam_eligibility_inst_dept" ON "exam_eligibility" USING btree ("institution_code","department");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_exam_eligibility_student" ON "exam_eligibility" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_exam_eligibility_status" ON "exam_eligibility" USING btree ("hall_ticket_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_exam_subjects_exam" ON "exam_subjects" USING btree ("exam_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_exam_subjects_exam_subject" ON "exam_subjects" USING btree ("exam_id","subject_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_exam_subjects_inst_id" ON "exam_subjects" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_exams_inst" ON "exams" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_exams_status" ON "exams" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_exams_inst_id" ON "exams" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expense_records_inst" ON "expense_records" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expense_records_category" ON "expense_records" USING btree ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expense_records_status" ON "expense_records" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expense_records_schedule" ON "expense_records" USING btree ("schedule_id") WHERE schedule_id is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_expense_period_key" ON "expense_records" USING btree ("schedule_id","period_key") WHERE schedule_id is not null and period_key is not null;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_payments_inst" ON "fee_payments" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_payments_student" ON "fee_payments" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_payments_fee_structure" ON "fee_payments" USING btree ("fee_structure_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_payments_status" ON "fee_payments" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_payments_payment_order" ON "fee_payments" USING btree ("payment_order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_structures_inst" ON "fee_structures" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_structures_class" ON "fee_structures" USING btree ("class_section_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fee_structures_category" ON "fee_structures" USING btree ("category");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fee_structures_inst_id" ON "fee_structures" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_homework_inst" ON "homework" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_homework_class" ON "homework" USING btree ("class_section_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_homework_teacher" ON "homework" USING btree ("teacher_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_homework_subject" ON "homework" USING btree ("subject_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_homework_due_date" ON "homework" USING btree ("due_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_authors_inst" ON "library_authors" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_authors_name" ON "library_authors" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_copies_inst" ON "library_book_copies" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_copies_book" ON "library_book_copies" USING btree ("book_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_copies_status" ON "library_book_copies" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_copies_inst_accession" ON "library_book_copies" USING btree ("institution_code","accession_number");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_copies_inst_barcode" ON "library_book_copies" USING btree ("institution_code","barcode");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_copies_inst_id" ON "library_book_copies" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_books_inst" ON "library_books" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_books_category" ON "library_books" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_books_isbn" ON "library_books" USING btree ("isbn");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_books_inst_isbn" ON "library_books" USING btree ("institution_code","isbn");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_books_inst_id" ON "library_books" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_categories_inst" ON "library_categories" USING btree ("institution_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_categories_inst_name" ON "library_categories" USING btree ("institution_code","name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_categories_inst_id" ON "library_categories" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_fines_inst" ON "library_fines" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_fines_student" ON "library_fines" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_fines_loan" ON "library_fines" USING btree ("loan_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_fines_status" ON "library_fines" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_fines_inst_id" ON "library_fines" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_loans_inst" ON "library_loans" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_loans_copy" ON "library_loans" USING btree ("copy_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_loans_book" ON "library_loans" USING btree ("book_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_loans_student" ON "library_loans" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_loans_status" ON "library_loans" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_loans_active_copy" ON "library_loans" USING btree ("copy_id") WHERE status IN ('ACTIVE', 'OVERDUE');
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_loans_inst_id" ON "library_loans" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_txns_inst" ON "library_payment_transactions" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_txns_fine" ON "library_payment_transactions" USING btree ("fine_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_txns_receipt" ON "library_payment_transactions" USING btree ("institution_code","receipt_no");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_pyq_inst" ON "library_question_papers" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_pyq_subject" ON "library_question_papers" USING btree ("subject");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_pyq_year" ON "library_question_papers" USING btree ("academic_year");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_pyq_class" ON "library_question_papers" USING btree ("class_grade");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_res_inst" ON "library_reservations" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_res_book" ON "library_reservations" USING btree ("book_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_res_student" ON "library_reservations" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lib_res_status" ON "library_reservations" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_settings_inst" ON "library_settings" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_marks_exam" ON "marks" USING btree ("exam_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_marks_student" ON "marks" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_marks_class" ON "marks" USING btree ("class_section_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_marks_exam_subject_student" ON "marks" USING btree ("exam_subject_id","student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_audit_inst" ON "notification_audit_log" USING btree ("institution_code","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_audit_action" ON "notification_audit_log" USING btree ("action");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_audit_notification" ON "notification_audit_log" USING btree ("notification_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_campaigns_inst" ON "notification_campaigns" USING btree ("institution_code","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_campaigns_status" ON "notification_campaigns" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_preferences_user" ON "notification_preferences" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_notification_preferences_user" ON "notification_preferences" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_templates_inst" ON "notification_templates" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_templates_type" ON "notification_templates" USING btree ("institution_code","type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_recipient" ON "notifications" USING btree ("recipient_id","read_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_institution" ON "notifications" USING btree ("institution_code","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_status" ON "notifications" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_pending" ON "notifications" USING btree ("status") WHERE status = 'pending';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "notifications" USING btree ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parent_links_parent" ON "parent_links" USING btree ("parent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parent_links_student" ON "parent_links" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_parent_links_inst" ON "parent_links" USING btree ("institution_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_parent_links_parent_student" ON "parent_links" USING btree ("parent_id","student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_inst" ON "payment_orders" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_student" ON "payment_orders" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_status" ON "payment_orders" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_orders_gateway_order" ON "payment_orders" USING btree ("gateway_order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payment_orders_webhook_event" ON "payment_orders" USING btree ("webhook_event_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payment_orders_gateway_order" ON "payment_orders" USING btree ("gateway_order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payment_orders_open_per_student" ON "payment_orders" USING btree ("institution_code","student_id") WHERE status IN ('created', 'authorized');
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payment_orders_inst_id" ON "payment_orders" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_inst" ON "payment_transactions" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_order" ON "payment_transactions" USING btree ("payment_order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_gateway_payment" ON "payment_transactions" USING btree ("gateway_payment_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payment_transactions_gateway_refund" ON "payment_transactions" USING btree ("institution_code","gateway_refund_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payroll_schedules_inst" ON "payroll_schedules" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payroll_schedules_user" ON "payroll_schedules" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payroll_schedules_active_user" ON "payroll_schedules" USING btree ("institution_code","user_id") WHERE active;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_periods_inst" ON "periods" USING btree ("institution_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_periods_inst_id" ON "periods" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_placement_announcements_inst" ON "placement_announcements" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_placement_announcements_drive" ON "placement_announcements" USING btree ("drive_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_placement_drives_inst" ON "placement_drives" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_placement_drives_status" ON "placement_drives" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_placement_drives_inst_id" ON "placement_drives" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_placement_members_inst" ON "placement_members" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_placement_members_user" ON "placement_members" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_placement_members_inst_user" ON "placement_members" USING btree ("institution_code","user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_push_tokens_user" ON "push_tokens" USING btree ("user_id","is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_push_tokens_institution" ON "push_tokens" USING btree ("institution_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_push_tokens_token" ON "push_tokens" USING btree ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_school_notices_inst" ON "school_notices" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_school_notices_dept" ON "school_notices" USING btree ("department");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_school_notices_audience" ON "school_notices" USING btree ("target_audience");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_school_notices_created" ON "school_notices" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_classes_inst" ON "student_classes" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_classes_student" ON "student_classes" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_classes_class" ON "student_classes" USING btree ("class_section_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_classes_active_student" ON "student_classes" USING btree ("student_id","is_active");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_student_classes_class_student_year" ON "student_classes" USING btree ("class_section_id","student_id","academic_year");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_documents_inst" ON "student_documents" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_documents_student" ON "student_documents" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_transport_route" ON "student_transport" USING btree ("route_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_student_transport_student_route" ON "student_transport" USING btree ("student_id","route_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subject_teachers_inst" ON "subject_teachers" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subject_teachers_class" ON "subject_teachers" USING btree ("class_section_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subject_teachers_teacher" ON "subject_teachers" USING btree ("teacher_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_subject_teachers_class_subject" ON "subject_teachers" USING btree ("class_section_id","subject_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subjects_inst" ON "subjects" USING btree ("institution_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_subjects_inst_name" ON "subjects" USING btree ("institution_code","name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_subjects_inst_id" ON "subjects" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_timetable_slots_tt" ON "timetable_slots" USING btree ("timetable_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_timetable_slots_teacher" ON "timetable_slots" USING btree ("teacher_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_timetable_slots_class" ON "timetable_slots" USING btree ("class_section_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_timetable_slots_tt_day_period" ON "timetable_slots" USING btree ("timetable_id","day_of_week","period_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_timetable_slots_inst_id" ON "timetable_slots" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_timetables_inst" ON "timetables" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_timetables_class" ON "timetables" USING btree ("class_section_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_timetables_class_version" ON "timetables" USING btree ("class_section_id","version");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_timetables_inst_id" ON "timetables" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_institution_code" ON "users" USING btree ("institution_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_institution_role" ON "users" USING btree ("institution_code","role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_admin_role" ON "users" USING btree ("role") WHERE role = 'admin';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_inst_id" ON "users" USING btree ("institution_code","id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_inst_uid" ON "users" USING btree ("institution_code","firebase_uid");
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_admission_apps_preferred_course'
      AND conrelid = 'public."admission_applications"'::regclass
  ) THEN
    ALTER TABLE "admission_applications" ADD CONSTRAINT "fk_admission_apps_preferred_course" FOREIGN KEY ("institution_code","preferred_course_id") REFERENCES "public"."admission_courses"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_admission_apps_allocated_course'
      AND conrelid = 'public."admission_applications"'::regclass
  ) THEN
    ALTER TABLE "admission_applications" ADD CONSTRAINT "fk_admission_apps_allocated_course" FOREIGN KEY ("institution_code","allocated_course_id") REFERENCES "public"."admission_courses"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_admissions_school'
      AND conrelid = 'public."admissions"'::regclass
  ) THEN
    ALTER TABLE "admissions" ADD CONSTRAINT "fk_admissions_school" FOREIGN KEY ("school_id") REFERENCES "public"."institutions"("institution_code") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_announcement_reads_announcement'
      AND conrelid = 'public."announcement_reads"'::regclass
  ) THEN
    ALTER TABLE "announcement_reads" ADD CONSTRAINT "fk_announcement_reads_announcement" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_announcement_reads_user'
      AND conrelid = 'public."announcement_reads"'::regclass
  ) THEN
    ALTER TABLE "announcement_reads" ADD CONSTRAINT "fk_announcement_reads_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("firebase_uid") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_announcement_targets_announcement'
      AND conrelid = 'public."announcement_targets"'::regclass
  ) THEN
    ALTER TABLE "announcement_targets" ADD CONSTRAINT "fk_announcement_targets_announcement" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_announcements_creator'
      AND conrelid = 'public."announcements"'::regclass
  ) THEN
    ALTER TABLE "announcements" ADD CONSTRAINT "fk_announcements_creator" FOREIGN KEY ("institution_code","created_by") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_attendance_entries_record'
      AND conrelid = 'public."attendance_entries"'::regclass
  ) THEN
    ALTER TABLE "attendance_entries" ADD CONSTRAINT "fk_attendance_entries_record" FOREIGN KEY ("attendance_record_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_attendance_entries_student'
      AND conrelid = 'public."attendance_entries"'::regclass
  ) THEN
    ALTER TABLE "attendance_entries" ADD CONSTRAINT "fk_attendance_entries_student" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_attendance_records_slot'
      AND conrelid = 'public."attendance_records"'::regclass
  ) THEN
    ALTER TABLE "attendance_records" ADD CONSTRAINT "fk_attendance_records_slot" FOREIGN KEY ("institution_code","timetable_slot_id") REFERENCES "public"."timetable_slots"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_attendance_records_teacher'
      AND conrelid = 'public."attendance_records"'::regclass
  ) THEN
    ALTER TABLE "attendance_records" ADD CONSTRAINT "fk_attendance_records_teacher" FOREIGN KEY ("institution_code","taken_by_teacher_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_bus_locations_trip'
      AND conrelid = 'public."bus_locations"'::regclass
  ) THEN
    ALTER TABLE "bus_locations" ADD CONSTRAINT "fk_bus_locations_trip" FOREIGN KEY ("trip_id") REFERENCES "public"."bus_trips"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_bus_routes_vehicle'
      AND conrelid = 'public."bus_routes"'::regclass
  ) THEN
    ALTER TABLE "bus_routes" ADD CONSTRAINT "fk_bus_routes_vehicle" FOREIGN KEY ("institution_code","vehicle_id") REFERENCES "public"."bus_vehicles"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_bus_stops_route'
      AND conrelid = 'public."bus_stops"'::regclass
  ) THEN
    ALTER TABLE "bus_stops" ADD CONSTRAINT "fk_bus_stops_route" FOREIGN KEY ("institution_code","route_id") REFERENCES "public"."bus_routes"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_bus_trips_route'
      AND conrelid = 'public."bus_trips"'::regclass
  ) THEN
    ALTER TABLE "bus_trips" ADD CONSTRAINT "fk_bus_trips_route" FOREIGN KEY ("institution_code","route_id") REFERENCES "public"."bus_routes"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_counseling_student'
      AND conrelid = 'public."counseling_records"'::regclass
  ) THEN
    ALTER TABLE "counseling_records" ADD CONSTRAINT "fk_counseling_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_counseling_counselor'
      AND conrelid = 'public."counseling_records"'::regclass
  ) THEN
    ALTER TABLE "counseling_records" ADD CONSTRAINT "fk_counseling_counselor" FOREIGN KEY ("institution_code","counselor_id") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_drive_applications_drive'
      AND conrelid = 'public."drive_applications"'::regclass
  ) THEN
    ALTER TABLE "drive_applications" ADD CONSTRAINT "fk_drive_applications_drive" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drives"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_drive_applications_student'
      AND conrelid = 'public."drive_applications"'::regclass
  ) THEN
    ALTER TABLE "drive_applications" ADD CONSTRAINT "fk_drive_applications_student" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_exam_eligibility_student'
      AND conrelid = 'public."exam_eligibility"'::regclass
  ) THEN
    ALTER TABLE "exam_eligibility" ADD CONSTRAINT "fk_exam_eligibility_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_exam_subjects_exam'
      AND conrelid = 'public."exam_subjects"'::regclass
  ) THEN
    ALTER TABLE "exam_subjects" ADD CONSTRAINT "fk_exam_subjects_exam" FOREIGN KEY ("institution_code","exam_id") REFERENCES "public"."exams"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_exam_subjects_subject'
      AND conrelid = 'public."exam_subjects"'::regclass
  ) THEN
    ALTER TABLE "exam_subjects" ADD CONSTRAINT "fk_exam_subjects_subject" FOREIGN KEY ("institution_code","subject_id") REFERENCES "public"."subjects"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_exams_creator'
      AND conrelid = 'public."exams"'::regclass
  ) THEN
    ALTER TABLE "exams" ADD CONSTRAINT "fk_exams_creator" FOREIGN KEY ("institution_code","created_by") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_expense_records_user'
      AND conrelid = 'public."expense_records"'::regclass
  ) THEN
    ALTER TABLE "expense_records" ADD CONSTRAINT "fk_expense_records_user" FOREIGN KEY ("institution_code","user_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_fee_payments_structure'
      AND conrelid = 'public."fee_payments"'::regclass
  ) THEN
    ALTER TABLE "fee_payments" ADD CONSTRAINT "fk_fee_payments_structure" FOREIGN KEY ("institution_code","fee_structure_id") REFERENCES "public"."fee_structures"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_fee_payments_student'
      AND conrelid = 'public."fee_payments"'::regclass
  ) THEN
    ALTER TABLE "fee_payments" ADD CONSTRAINT "fk_fee_payments_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_fee_structures_class'
      AND conrelid = 'public."fee_structures"'::regclass
  ) THEN
    ALTER TABLE "fee_structures" ADD CONSTRAINT "fk_fee_structures_class" FOREIGN KEY ("institution_code","class_section_id") REFERENCES "public"."class_sections"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_homework_class'
      AND conrelid = 'public."homework"'::regclass
  ) THEN
    ALTER TABLE "homework" ADD CONSTRAINT "fk_homework_class" FOREIGN KEY ("institution_code","class_section_id") REFERENCES "public"."class_sections"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_homework_subject'
      AND conrelid = 'public."homework"'::regclass
  ) THEN
    ALTER TABLE "homework" ADD CONSTRAINT "fk_homework_subject" FOREIGN KEY ("institution_code","subject_id") REFERENCES "public"."subjects"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_homework_teacher'
      AND conrelid = 'public."homework"'::regclass
  ) THEN
    ALTER TABLE "homework" ADD CONSTRAINT "fk_homework_teacher" FOREIGN KEY ("institution_code","teacher_id") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_homework_creator'
      AND conrelid = 'public."homework"'::regclass
  ) THEN
    ALTER TABLE "homework" ADD CONSTRAINT "fk_homework_creator" FOREIGN KEY ("institution_code","created_by") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_copies_book'
      AND conrelid = 'public."library_book_copies"'::regclass
  ) THEN
    ALTER TABLE "library_book_copies" ADD CONSTRAINT "fk_lib_copies_book" FOREIGN KEY ("institution_code","book_id") REFERENCES "public"."library_books"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_books_category'
      AND conrelid = 'public."library_books"'::regclass
  ) THEN
    ALTER TABLE "library_books" ADD CONSTRAINT "fk_lib_books_category" FOREIGN KEY ("institution_code","category_id") REFERENCES "public"."library_categories"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_fines_loan'
      AND conrelid = 'public."library_fines"'::regclass
  ) THEN
    ALTER TABLE "library_fines" ADD CONSTRAINT "fk_lib_fines_loan" FOREIGN KEY ("institution_code","loan_id") REFERENCES "public"."library_loans"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_fines_copy'
      AND conrelid = 'public."library_fines"'::regclass
  ) THEN
    ALTER TABLE "library_fines" ADD CONSTRAINT "fk_lib_fines_copy" FOREIGN KEY ("institution_code","book_copy_id") REFERENCES "public"."library_book_copies"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_fines_student'
      AND conrelid = 'public."library_fines"'::regclass
  ) THEN
    ALTER TABLE "library_fines" ADD CONSTRAINT "fk_lib_fines_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_loans_copy'
      AND conrelid = 'public."library_loans"'::regclass
  ) THEN
    ALTER TABLE "library_loans" ADD CONSTRAINT "fk_lib_loans_copy" FOREIGN KEY ("institution_code","copy_id") REFERENCES "public"."library_book_copies"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_loans_book'
      AND conrelid = 'public."library_loans"'::regclass
  ) THEN
    ALTER TABLE "library_loans" ADD CONSTRAINT "fk_lib_loans_book" FOREIGN KEY ("institution_code","book_id") REFERENCES "public"."library_books"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_loans_student'
      AND conrelid = 'public."library_loans"'::regclass
  ) THEN
    ALTER TABLE "library_loans" ADD CONSTRAINT "fk_lib_loans_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_txns_fine'
      AND conrelid = 'public."library_payment_transactions"'::regclass
  ) THEN
    ALTER TABLE "library_payment_transactions" ADD CONSTRAINT "fk_lib_txns_fine" FOREIGN KEY ("institution_code","fine_id") REFERENCES "public"."library_fines"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_res_book'
      AND conrelid = 'public."library_reservations"'::regclass
  ) THEN
    ALTER TABLE "library_reservations" ADD CONSTRAINT "fk_lib_res_book" FOREIGN KEY ("institution_code","book_id") REFERENCES "public"."library_books"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lib_res_student'
      AND conrelid = 'public."library_reservations"'::regclass
  ) THEN
    ALTER TABLE "library_reservations" ADD CONSTRAINT "fk_lib_res_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_marks_exam'
      AND conrelid = 'public."marks"'::regclass
  ) THEN
    ALTER TABLE "marks" ADD CONSTRAINT "fk_marks_exam" FOREIGN KEY ("institution_code","exam_id") REFERENCES "public"."exams"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_marks_exam_subject'
      AND conrelid = 'public."marks"'::regclass
  ) THEN
    ALTER TABLE "marks" ADD CONSTRAINT "fk_marks_exam_subject" FOREIGN KEY ("institution_code","exam_subject_id") REFERENCES "public"."exam_subjects"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_marks_student'
      AND conrelid = 'public."marks"'::regclass
  ) THEN
    ALTER TABLE "marks" ADD CONSTRAINT "fk_marks_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_marks_class'
      AND conrelid = 'public."marks"'::regclass
  ) THEN
    ALTER TABLE "marks" ADD CONSTRAINT "fk_marks_class" FOREIGN KEY ("institution_code","class_section_id") REFERENCES "public"."class_sections"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_marks_subject'
      AND conrelid = 'public."marks"'::regclass
  ) THEN
    ALTER TABLE "marks" ADD CONSTRAINT "fk_marks_subject" FOREIGN KEY ("institution_code","subject_id") REFERENCES "public"."subjects"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_marks_entered_by'
      AND conrelid = 'public."marks"'::regclass
  ) THEN
    ALTER TABLE "marks" ADD CONSTRAINT "fk_marks_entered_by" FOREIGN KEY ("institution_code","entered_by") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_notification_audit_notification'
      AND conrelid = 'public."notification_audit_log"'::regclass
  ) THEN
    ALTER TABLE "notification_audit_log" ADD CONSTRAINT "fk_notification_audit_notification" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_notification_audit_campaign'
      AND conrelid = 'public."notification_audit_log"'::regclass
  ) THEN
    ALTER TABLE "notification_audit_log" ADD CONSTRAINT "fk_notification_audit_campaign" FOREIGN KEY ("campaign_id") REFERENCES "public"."notification_campaigns"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_notification_audit_user'
      AND conrelid = 'public."notification_audit_log"'::regclass
  ) THEN
    ALTER TABLE "notification_audit_log" ADD CONSTRAINT "fk_notification_audit_user" FOREIGN KEY ("institution_code","user_id") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_notification_campaigns_creator'
      AND conrelid = 'public."notification_campaigns"'::regclass
  ) THEN
    ALTER TABLE "notification_campaigns" ADD CONSTRAINT "fk_notification_campaigns_creator" FOREIGN KEY ("institution_code","created_by") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_notification_preferences_user'
      AND conrelid = 'public."notification_preferences"'::regclass
  ) THEN
    ALTER TABLE "notification_preferences" ADD CONSTRAINT "fk_notification_preferences_user" FOREIGN KEY ("institution_code","user_id") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_notifications_recipient'
      AND conrelid = 'public."notifications"'::regclass
  ) THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_recipient" FOREIGN KEY ("institution_code","recipient_id") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_parent_links_parent'
      AND conrelid = 'public."parent_links"'::regclass
  ) THEN
    ALTER TABLE "parent_links" ADD CONSTRAINT "fk_parent_links_parent" FOREIGN KEY ("institution_code","parent_id") REFERENCES "public"."users"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_parent_links_student'
      AND conrelid = 'public."parent_links"'::regclass
  ) THEN
    ALTER TABLE "parent_links" ADD CONSTRAINT "fk_parent_links_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_payment_orders_student'
      AND conrelid = 'public."payment_orders"'::regclass
  ) THEN
    ALTER TABLE "payment_orders" ADD CONSTRAINT "fk_payment_orders_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_payment_orders_payer'
      AND conrelid = 'public."payment_orders"'::regclass
  ) THEN
    ALTER TABLE "payment_orders" ADD CONSTRAINT "fk_payment_orders_payer" FOREIGN KEY ("institution_code","payer_uid") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_payment_transactions_order'
      AND conrelid = 'public."payment_transactions"'::regclass
  ) THEN
    ALTER TABLE "payment_transactions" ADD CONSTRAINT "fk_payment_transactions_order" FOREIGN KEY ("institution_code","payment_order_id") REFERENCES "public"."payment_orders"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_payroll_schedules_user'
      AND conrelid = 'public."payroll_schedules"'::regclass
  ) THEN
    ALTER TABLE "payroll_schedules" ADD CONSTRAINT "fk_payroll_schedules_user" FOREIGN KEY ("institution_code","user_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_placement_announcements_drive'
      AND conrelid = 'public."placement_announcements"'::regclass
  ) THEN
    ALTER TABLE "placement_announcements" ADD CONSTRAINT "fk_placement_announcements_drive" FOREIGN KEY ("institution_code","drive_id") REFERENCES "public"."placement_drives"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_placement_announcements_poster'
      AND conrelid = 'public."placement_announcements"'::regclass
  ) THEN
    ALTER TABLE "placement_announcements" ADD CONSTRAINT "fk_placement_announcements_poster" FOREIGN KEY ("institution_code","posted_by") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_placement_drives_creator'
      AND conrelid = 'public."placement_drives"'::regclass
  ) THEN
    ALTER TABLE "placement_drives" ADD CONSTRAINT "fk_placement_drives_creator" FOREIGN KEY ("institution_code","created_by") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_placement_members_user'
      AND conrelid = 'public."placement_members"'::regclass
  ) THEN
    ALTER TABLE "placement_members" ADD CONSTRAINT "fk_placement_members_user" FOREIGN KEY ("institution_code","user_id") REFERENCES "public"."users"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_push_tokens_user'
      AND conrelid = 'public."push_tokens"'::regclass
  ) THEN
    ALTER TABLE "push_tokens" ADD CONSTRAINT "fk_push_tokens_user" FOREIGN KEY ("institution_code","user_id") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_school_notices_author'
      AND conrelid = 'public."school_notices"'::regclass
  ) THEN
    ALTER TABLE "school_notices" ADD CONSTRAINT "fk_school_notices_author" FOREIGN KEY ("institution_code","author_id") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_student_classes_student'
      AND conrelid = 'public."student_classes"'::regclass
  ) THEN
    ALTER TABLE "student_classes" ADD CONSTRAINT "fk_student_classes_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_student_classes_class'
      AND conrelid = 'public."student_classes"'::regclass
  ) THEN
    ALTER TABLE "student_classes" ADD CONSTRAINT "fk_student_classes_class" FOREIGN KEY ("institution_code","class_section_id") REFERENCES "public"."class_sections"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_student_documents_student'
      AND conrelid = 'public."student_documents"'::regclass
  ) THEN
    ALTER TABLE "student_documents" ADD CONSTRAINT "fk_student_documents_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_student_placement_profiles_user'
      AND conrelid = 'public."student_placement_profiles"'::regclass
  ) THEN
    ALTER TABLE "student_placement_profiles" ADD CONSTRAINT "fk_student_placement_profiles_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_student_transport_student'
      AND conrelid = 'public."student_transport"'::regclass
  ) THEN
    ALTER TABLE "student_transport" ADD CONSTRAINT "fk_student_transport_student" FOREIGN KEY ("institution_code","student_id") REFERENCES "public"."users"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_student_transport_route'
      AND conrelid = 'public."student_transport"'::regclass
  ) THEN
    ALTER TABLE "student_transport" ADD CONSTRAINT "fk_student_transport_route" FOREIGN KEY ("institution_code","route_id") REFERENCES "public"."bus_routes"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_student_transport_stop'
      AND conrelid = 'public."student_transport"'::regclass
  ) THEN
    ALTER TABLE "student_transport" ADD CONSTRAINT "fk_student_transport_stop" FOREIGN KEY ("institution_code","stop_id") REFERENCES "public"."bus_stops"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_subject_teachers_class'
      AND conrelid = 'public."subject_teachers"'::regclass
  ) THEN
    ALTER TABLE "subject_teachers" ADD CONSTRAINT "fk_subject_teachers_class" FOREIGN KEY ("institution_code","class_section_id") REFERENCES "public"."class_sections"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_subject_teachers_subject'
      AND conrelid = 'public."subject_teachers"'::regclass
  ) THEN
    ALTER TABLE "subject_teachers" ADD CONSTRAINT "fk_subject_teachers_subject" FOREIGN KEY ("institution_code","subject_id") REFERENCES "public"."subjects"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_timetable_slots_timetable'
      AND conrelid = 'public."timetable_slots"'::regclass
  ) THEN
    ALTER TABLE "timetable_slots" ADD CONSTRAINT "fk_timetable_slots_timetable" FOREIGN KEY ("institution_code","timetable_id") REFERENCES "public"."timetables"("institution_code","id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_timetable_slots_class'
      AND conrelid = 'public."timetable_slots"'::regclass
  ) THEN
    ALTER TABLE "timetable_slots" ADD CONSTRAINT "fk_timetable_slots_class" FOREIGN KEY ("institution_code","class_section_id") REFERENCES "public"."class_sections"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_timetable_slots_subject'
      AND conrelid = 'public."timetable_slots"'::regclass
  ) THEN
    ALTER TABLE "timetable_slots" ADD CONSTRAINT "fk_timetable_slots_subject" FOREIGN KEY ("institution_code","subject_id") REFERENCES "public"."subjects"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_timetable_slots_period'
      AND conrelid = 'public."timetable_slots"'::regclass
  ) THEN
    ALTER TABLE "timetable_slots" ADD CONSTRAINT "fk_timetable_slots_period" FOREIGN KEY ("institution_code","period_id") REFERENCES "public"."periods"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_timetables_class'
      AND conrelid = 'public."timetables"'::regclass
  ) THEN
    ALTER TABLE "timetables" ADD CONSTRAINT "fk_timetables_class" FOREIGN KEY ("institution_code","class_section_id") REFERENCES "public"."class_sections"("institution_code","id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_timetables_creator'
      AND conrelid = 'public."timetables"'::regclass
  ) THEN
    ALTER TABLE "timetables" ADD CONSTRAINT "fk_timetables_creator" FOREIGN KEY ("institution_code","created_by") REFERENCES "public"."users"("institution_code","firebase_uid") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
