const { Pool } = require('pg');
const p = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/schoolerp' });

async function run() {
  await p.query("UPDATE bus_trips SET status='completed', ended_at=NOW() WHERE id='real_trip_live_01'");
  console.log('Ended pre-seeded live trip');
  await p.query("DELETE FROM bus_locations WHERE trip_id='real_trip_live_01'");
  console.log('Cleared pre-seeded location');
  await p.end();
}
run();
