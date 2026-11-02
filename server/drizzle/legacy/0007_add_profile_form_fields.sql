-- Migration 0007: per-role profile form fields (Settings → Form Fields)
-- Adds the institution-scoped config blob and drops the removed Admission
-- module's (Fields / Seat Tracking / Fee Structure) columns.

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS profile_form_fields jsonb DEFAULT '{}'::jsonb;

ALTER TABLE institutions DROP COLUMN IF EXISTS admission_form_fields;
ALTER TABLE institutions DROP COLUMN IF EXISTS admission_seat_categories;
ALTER TABLE institutions DROP COLUMN IF EXISTS admission_seat_allocations;
