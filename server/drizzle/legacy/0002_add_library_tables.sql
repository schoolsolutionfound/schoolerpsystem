-- Migration: 0002_add_library_tables
-- Description: Add database tables, indexes, and unique constraints for full-stack Library module

CREATE TABLE IF NOT EXISTS "library_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text DEFAULT '',
	"parent_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_lib_categories_inst_name" UNIQUE("institution_code", "name")
);

CREATE TABLE IF NOT EXISTS "library_authors" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"bio" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

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
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_lib_books_inst_isbn" UNIQUE("institution_code", "isbn")
);

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
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_lib_copies_inst_accession" UNIQUE("institution_code", "accession_number"),
	CONSTRAINT "uq_lib_copies_inst_barcode" UNIQUE("institution_code", "barcode")
);

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

CREATE UNIQUE INDEX IF NOT EXISTS "uq_lib_loans_active_copy" ON "library_loans" ("copy_id") WHERE status IN ('ACTIVE', 'OVERDUE');

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
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_lib_txns_receipt" UNIQUE("institution_code", "receipt_no")
);

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
	"downloads_count" integer DEFAULT 0 NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

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
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_lib_settings_inst" UNIQUE("institution_code")
);

-- INDEXES
CREATE INDEX IF NOT EXISTS "idx_lib_categories_inst" ON "library_categories" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_lib_authors_inst" ON "library_authors" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_lib_authors_name" ON "library_authors" ("name");
CREATE INDEX IF NOT EXISTS "idx_lib_books_inst" ON "library_books" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_lib_books_category" ON "library_books" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_lib_books_isbn" ON "library_books" ("isbn");
CREATE INDEX IF NOT EXISTS "idx_lib_copies_inst" ON "library_book_copies" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_lib_copies_book" ON "library_book_copies" ("book_id");
CREATE INDEX IF NOT EXISTS "idx_lib_copies_status" ON "library_book_copies" ("status");
CREATE INDEX IF NOT EXISTS "idx_lib_loans_inst" ON "library_loans" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_lib_loans_copy" ON "library_loans" ("copy_id");
CREATE INDEX IF NOT EXISTS "idx_lib_loans_book" ON "library_loans" ("book_id");
CREATE INDEX IF NOT EXISTS "idx_lib_loans_student" ON "library_loans" ("student_id");
CREATE INDEX IF NOT EXISTS "idx_lib_loans_status" ON "library_loans" ("status");
CREATE INDEX IF NOT EXISTS "idx_lib_res_inst" ON "library_reservations" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_lib_res_book" ON "library_reservations" ("book_id");
CREATE INDEX IF NOT EXISTS "idx_lib_res_student" ON "library_reservations" ("student_id");
CREATE INDEX IF NOT EXISTS "idx_lib_res_status" ON "library_reservations" ("status");
CREATE INDEX IF NOT EXISTS "idx_lib_fines_inst" ON "library_fines" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_lib_fines_student" ON "library_fines" ("student_id");
CREATE INDEX IF NOT EXISTS "idx_lib_fines_loan" ON "library_fines" ("loan_id");
CREATE INDEX IF NOT EXISTS "idx_lib_fines_status" ON "library_fines" ("status");
CREATE INDEX IF NOT EXISTS "idx_lib_txns_inst" ON "library_payment_transactions" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_lib_txns_fine" ON "library_payment_transactions" ("fine_id");
CREATE INDEX IF NOT EXISTS "idx_lib_pyq_inst" ON "library_question_papers" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_lib_pyq_subject" ON "library_question_papers" ("subject");
CREATE INDEX IF NOT EXISTS "idx_lib_pyq_year" ON "library_question_papers" ("academic_year");
CREATE INDEX IF NOT EXISTS "idx_lib_pyq_class" ON "library_question_papers" ("class_grade");
