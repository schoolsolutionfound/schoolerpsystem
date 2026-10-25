import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  await sql`UPDATE users SET role = 'placement_officer' WHERE email = 'placement@schoolerp.com'`;
  const [updated] = await sql`SELECT id, email, role FROM users WHERE email = 'placement@schoolerp.com'`;
  console.log('Updated user role:', updated);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
