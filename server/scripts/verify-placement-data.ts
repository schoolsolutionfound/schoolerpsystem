import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const users = await sql`SELECT id, email, role, profile_completed, must_change_password FROM users`;
  console.log('Users in DB:');
  console.table(users);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
