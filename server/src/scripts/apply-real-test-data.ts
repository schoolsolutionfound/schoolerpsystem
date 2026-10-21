import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/schoolerp';

async function run() {
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('Connected to PostgreSQL:', connectionString.replace(/:[^:@]+@/, ':****@'));

    const deleteSqlPath = path.resolve(__dirname, '../../../test db/delete_test_data.sql');
    const realSqlPath = path.resolve(__dirname, '../../../test db/real_test_data.sql');

    console.log('\n--- 1. Executing delete_test_data.sql ---');
    const deleteSql = fs.readFileSync(deleteSqlPath, 'utf-8');
    await client.query(deleteSql);
    console.log('Successfully executed delete_test_data.sql');

    console.log('\n--- 2. Executing real_test_data.sql ---');
    const realSql = fs.readFileSync(realSqlPath, 'utf-8');
    await client.query(realSql);
    console.log('Successfully executed real_test_data.sql');

    console.log('\n--- 3. Verifying Database Records ---');
    const res = await client.query(`
      SELECT 'institutions' AS table_name, count(*) AS count FROM institutions WHERE institution_code = 'REAL001'
      UNION ALL
      SELECT 'users', count(*) FROM users WHERE institution_code = 'REAL001'
      UNION ALL
      SELECT 'bus_vehicles', count(*) FROM bus_vehicles WHERE institution_code = 'REAL001'
      UNION ALL
      SELECT 'bus_routes', count(*) FROM bus_routes WHERE institution_code = 'REAL001'
      UNION ALL
      SELECT 'bus_stops', count(*) FROM bus_stops WHERE institution_code = 'REAL001'
      UNION ALL
      SELECT 'student_transport', count(*) FROM student_transport WHERE institution_code = 'REAL001'
      UNION ALL
      SELECT 'bus_trips', count(*) FROM bus_trips WHERE institution_code = 'REAL001'
      UNION ALL
      SELECT 'bus_locations', count(*) FROM bus_locations WHERE trip_id = 'real_trip_live_01';
    `);

    console.table(res.rows);

    const stopsRes = await client.query(`
      SELECT sequence, name, latitude, longitude FROM bus_stops WHERE institution_code = 'REAL001' ORDER BY sequence ASC;
    `);
    console.log('\nActive Bus Stops in Database:');
    console.table(stopsRes.rows);

  } catch (err: any) {
    console.error('Error executing SQL:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
