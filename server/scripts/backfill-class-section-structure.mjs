// Idempotent backfill for class_sections rows written by the old school
// Academics screen, which stored the stream/subject in `department` and the
// class in `academic_year` (swapped vs. the canonical convention).
//
// Canonical school row: department = class, academic_year = section letter.
// Canonical college row: department = department, academic_year = year.
//
// Run from server/ with: node scripts/backfill-class-section-structure.mjs
// Add --dry-run to only report what would change.

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dryRun = process.argv.includes('--dry-run');

const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error('[Backfill] DATABASE_URL is not set. Set it in server/.env.');
  process.exit(1);
}

const lower = (v) => String(v ?? '').trim().toLowerCase();
const asArray = (v) => (Array.isArray(v) ? v : []);

async function main() {
  const client = new pg.Client({ connectionString: rawDbUrl });
  await client.connect();
  let repaired = 0;
  let sectionsFilled = 0;

  try {
    await client.query('BEGIN');

    const { rows: institutions } = await client.query(
      `SELECT institution_code, institution_type, departments, academic_years, sections
         FROM institutions
        WHERE lower(institution_type) = 'school'`
    );

    for (const inst of institutions) {
      const units = asArray(inst.departments);
      const levels = asArray(inst.academic_years);
      const unitSet = new Set(units.map(lower));
      const levelSet = new Set(levels.map(lower));
      if (unitSet.size === 0 || levelSet.size === 0) continue;

      const { rows: sections } = await client.query(
        `SELECT id, name, department, academic_year, section
           FROM class_sections
          WHERE institution_code = $1`,
        [inst.institution_code]
      );

      for (const row of sections) {
        const department = String(row.department ?? '').trim();
        const academicYear = String(row.academic_year ?? '').trim();
        const section = String(row.section ?? '').trim();
        if (!department || !academicYear) continue;
        if (!unitSet.has(lower(department)) || !levelSet.has(lower(academicYear))) continue;

        const newDepartment = academicYear;
        const newAcademicYear = section;
        const newName = [newDepartment, newAcademicYear].filter(Boolean).join(' ');

        console.log(
          `[Backfill] ${inst.institution_code}: "${row.name}" -> "${newName}" ` +
            `(department ${department} -> ${newDepartment}, academic_year ${academicYear} -> ${newAcademicYear})`
        );
        if (!dryRun) {
          await client.query(
            `UPDATE class_sections
                SET name = $1, department = $2, academic_year = $3, section = $4
              WHERE id = $5`,
            [newName, newDepartment, newAcademicYear, section, row.id]
          );
        }
        repaired++;
      }

      // Institutions created before the `sections` column existed have no
      // section palette. Recover it from the rows we just normalized.
      const existingSections = asArray(inst.sections);
      if (existingSections.length === 0) {
        const { rows: distinct } = await client.query(
          `SELECT DISTINCT section
             FROM class_sections
            WHERE institution_code = $1 AND coalesce(section, '') <> ''
            ORDER BY section`,
          [inst.institution_code]
        );
        const letters = distinct.map((r) => String(r.section).trim()).filter(Boolean);
        if (letters.length > 0) {
          console.log(`[Backfill] ${inst.institution_code}: sections -> ${letters.join(', ')}`);
          if (!dryRun) {
            await client.query(
              `UPDATE institutions SET sections = $1::jsonb, updated_at = now() WHERE institution_code = $2`,
              [JSON.stringify(letters), inst.institution_code]
            );
          }
          sectionsFilled++;
        }
      }
    }

    if (dryRun) {
      await client.query('ROLLBACK');
      console.log(`[Backfill] Dry run complete: ${repaired} row(s) would be repaired, ${sectionsFilled} section list(s) filled.`);
    } else {
      await client.query('COMMIT');
      console.log(`[Backfill] Done: ${repaired} row(s) repaired, ${sectionsFilled} section list(s) filled.`);
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[Backfill] Failed:', err?.message || err);
  process.exit(1);
});
