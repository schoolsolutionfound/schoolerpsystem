// Link class_sections rows that predate an academic session (session_id blank)
// to the institution's current academic session.
//
// Canonical rule: a class/section belongs to exactly one academic year. Rows
// seeded before the first year existed (or inserted by structure edits that
// did not stamp a session) have session_id = '' / NULL. This script repairs
// those rows without touching already-linked sections, so it is idempotent.
//
// Run from server/ with:
//   node scripts/backfill-class-section-sessions.mjs
//   node scripts/backfill-class-section-sessions.mjs --dry-run
//   node scripts/backfill-class-section-sessions.mjs --institution=KIVQUOSCH01

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dryRun = process.argv.includes('--dry-run');
const onlyInstitution = process.argv
  .find((arg) => arg.startsWith('--institution='))
  ?.split('=')[1]
  ?.trim();

const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error('[Backfill] DATABASE_URL is not set. Set it in server/.env.');
  process.exit(1);
}

const BLANK = "coalesce(cs.session_id, '') = ''";

async function main() {
  const client = new pg.Client({ connectionString: rawDbUrl });
  await client.connect();
  let linked = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    const params = [];
    let where = BLANK;
    if (onlyInstitution) {
      params.push(onlyInstitution);
      where += ` AND lower(cs.institution_code) = lower($${params.length})`;
    }

    const { rows: institutions } = await client.query(
      `SELECT cs.institution_code, count(*)::int AS blank
         FROM class_sections cs
        WHERE ${where}
        GROUP BY cs.institution_code
        ORDER BY cs.institution_code`,
      params
    );

    if (institutions.length === 0) {
      console.log('[Backfill] No unlinked class_sections rows found.');
    }

    for (const inst of institutions) {
      const { rows: current } = await client.query(
        `SELECT id, name
           FROM academic_sessions
          WHERE lower(institution_code) = lower($1)
            AND is_current = true
          LIMIT 1`,
        [inst.institution_code]
      );

      if (current.length === 0) {
        console.warn(
          `[Backfill] ${inst.institution_code}: ${inst.blank} row(s) unlinked, but no current academic year. Skipped.`
        );
        skipped += inst.blank;
        continue;
      }

      const session = current[0];
      if (dryRun) {
        console.log(
          `[Backfill] ${inst.institution_code}: would link ${inst.blank} row(s) to "${session.name}" (${session.id}).`
        );
      } else {
        const { rowCount } = await client.query(
          `UPDATE class_sections cs
              SET session_id = $1, updated_at = now()
            WHERE lower(cs.institution_code) = lower($2)
              AND ${BLANK}`,
          [session.id, inst.institution_code]
        );
        linked += rowCount ?? 0;
        console.log(
          `[Backfill] ${inst.institution_code}: linked ${rowCount} row(s) to "${session.name}" (${session.id}).`
        );
      }
    }

    if (dryRun) {
      await client.query('ROLLBACK');
      console.log('[Backfill] Dry run complete (no changes committed).');
    } else {
      await client.query('COMMIT');
      console.log(`[Backfill] Done: ${linked} row(s) linked, ${skipped} row(s) skipped.`);
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
