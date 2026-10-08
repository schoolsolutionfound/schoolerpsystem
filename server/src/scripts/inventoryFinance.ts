import 'dotenv/config';
import pg from 'pg';

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const users = await client.query(
      'SELECT institution_code, role, COUNT(*)::int AS n FROM users GROUP BY 1, 2 ORDER BY 1, 2'
    );
    console.log('users:', JSON.stringify(users.rows));
    const fees = await client.query(
      'SELECT institution_code, COUNT(*)::int AS n FROM fee_structures GROUP BY 1'
    );
    console.log('fees:', JSON.stringify(fees.rows));
    const pays = await client.query(
      'SELECT institution_code, COUNT(*)::int AS n FROM fee_payments GROUP BY 1'
    );
    console.log('payments:', JSON.stringify(pays.rows));
    const parents = await client.query(
      `SELECT id, firebase_uid, institution_code, scope FROM users WHERE LOWER(role) = 'parent' LIMIT 5`
    );
    console.log('parents:', JSON.stringify(parents.rows));
    const students = await client.query(
      `SELECT id, firebase_uid, institution_code, full_name FROM users WHERE LOWER(role) = 'student' LIMIT 5`
    );
    console.log('students:', JSON.stringify(students.rows));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
