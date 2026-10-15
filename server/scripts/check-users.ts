import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

sql`SELECT email, role, firebase_uid FROM users`
  .then(res => {
    console.log('USERS IN DB:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
  });
