-- Migration: 0003_add_announcement_tables
-- Description: Add announcements, announcement_targets, and announcement_reads tables with indexes and constraints

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

CREATE TABLE IF NOT EXISTS "announcement_targets" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"target_type" varchar(50) DEFAULT 'all' NOT NULL,
	"target_role" varchar(50) DEFAULT '',
	"class_id" text DEFAULT '',
	"section_id" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "announcement_reads" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_announcement_reads_ann_user" UNIQUE("announcement_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "idx_announcements_institution_code" ON "announcements" ("institution_code");
CREATE INDEX IF NOT EXISTS "idx_announcements_status" ON "announcements" ("status");
CREATE INDEX IF NOT EXISTS "idx_announcements_type" ON "announcements" ("type");
CREATE INDEX IF NOT EXISTS "idx_announcements_priority" ON "announcements" ("priority");
CREATE INDEX IF NOT EXISTS "idx_announcements_created_by" ON "announcements" ("created_by");
CREATE INDEX IF NOT EXISTS "idx_announcements_publish_at" ON "announcements" ("publish_at");
CREATE INDEX IF NOT EXISTS "idx_announcements_expires_at" ON "announcements" ("expires_at");

CREATE INDEX IF NOT EXISTS "idx_announcement_targets_announcement_id" ON "announcement_targets" ("announcement_id");
CREATE INDEX IF NOT EXISTS "idx_announcement_targets_target_role" ON "announcement_targets" ("target_role");
CREATE INDEX IF NOT EXISTS "idx_announcement_targets_class_id" ON "announcement_targets" ("class_id");
CREATE INDEX IF NOT EXISTS "idx_announcement_targets_section_id" ON "announcement_targets" ("section_id");

CREATE INDEX IF NOT EXISTS "idx_announcement_reads_announcement_id" ON "announcement_reads" ("announcement_id");
CREATE INDEX IF NOT EXISTS "idx_announcement_reads_user_id" ON "announcement_reads" ("user_id");
