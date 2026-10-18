import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const users = await sql`SELECT id, email, role, firebase_uid FROM users`;
  console.log('USERS IN DB:', users);
  const pms = await sql`SELECT pm.*, u.email FROM placement_members pm LEFT JOIN users u ON pm.user_id = u.id`;
  console.log('PLACEMENT MEMBERS IN DB:', pms);
  process.exit(0);
}
main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
