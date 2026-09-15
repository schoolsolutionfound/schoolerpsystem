import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:raees1122@localhost:5432/school_erp';

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();

    const cls = await client.query(
      `SELECT id, name FROM class_sections WHERE institution_code = 'TST001' AND name = 'Class 6 A'`
    );
    if (cls.rows.length === 0) {
      console.log('Class 6 A not found.');
      return;
    }
    const classId = cls.rows[0].id;

    const tts = await client.query(
      `SELECT id, version, effective_from FROM timetables WHERE class_section_id = $1 ORDER BY version DESC`,
      [classId]
    );
    console.log(`Timetables for Class 6 A: ${tts.rows.length}`);
    console.table(tts.rows);

    const kadarSlots = await client.query(
      `SELECT ts.id, cs.name AS class_name, s.name AS subject_name,
              p.label AS period, p.start_time, p.end_time, ts.day_of_week
       FROM timetable_slots ts
       LEFT JOIN class_sections cs ON cs.id = ts.class_section_id
       LEFT JOIN subjects s ON s.id = ts.subject_id
       LEFT JOIN periods p ON p.id = ts.period_id
       WHERE ts.teacher_id = 'usr_1787066287949_dsdty'
         AND cs.name = 'Class 6 A'
       ORDER BY ts.day_of_week, p.sort_order`
    );
    console.log(`\nKadar's slots in Class 6 A: ${kadarSlots.rows.length}`);
    console.table(kadarSlots.rows);
  } catch (err) {
    console.error('[PG Error]', err && err.message);
  } finally {
    await client.end();
  }
}

main();
