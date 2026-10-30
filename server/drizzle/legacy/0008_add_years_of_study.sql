-- Migration 0008: separate college years of study from academic sessions.
-- schools keep classes in academic_years; colleges use years_of_study for
-- 1st/2nd/3rd/4th Year. Calendar sessions (e.g. 2026-27) live in academic_sessions.

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS years_of_study jsonb DEFAULT '[]'::jsonb;

-- Backfill existing colleges: their years currently sit in academic_years.
UPDATE institutions
SET years_of_study = academic_years,
    academic_years = '[]'::jsonb
WHERE lower(institution_type) = 'college'
  AND (years_of_study IS NULL OR years_of_study = '[]'::jsonb)
  AND academic_years IS NOT NULL
  AND academic_years <> '[]'::jsonb;
