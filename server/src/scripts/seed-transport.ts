import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

async function seedTransport() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/schoolerp';
  const client = new pg.Client({ connectionString });

  try {
    console.log('[Seed Transport] Connecting to PostgreSQL at', connectionString.replace(/:[^:@]+@/, ':***@'));
    await client.connect();

    // 1. Run migration SQL
    const migrationPath = path.resolve(process.cwd(), 'drizzle/0002_add_bus_transport.sql');
    console.log('[Seed Transport] Executing migration from:', migrationPath);
    if (fs.existsSync(migrationPath)) {
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');
      await client.query(sqlContent);
      console.log('[Seed Transport] Migration executed successfully.');
    } else {
      console.warn('[Seed Transport Warning] Migration file not found at:', migrationPath);
    }

    const institutionCode = 'TST001';
    const institutionName = 'Greenwood High School';

    // 2. Ensure institution exists
    await client.query(`
      INSERT INTO institutions (id, institution_code, institution_name, institution_type, subscription_status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (institution_code) DO UPDATE
      SET institution_name = EXCLUDED.institution_name,
          institution_type = EXCLUDED.institution_type,
          subscription_status = EXCLUDED.subscription_status;
    `, ['inst_tst001', institutionCode, institutionName, 'school', 'active']);
    console.log('[Seed Transport] Institution TST001 verified.');

    // 3. Ensure bypass users exist in users table
    const usersToSeed = [
      {
        id: 'driver_dev_bypass',
        firebaseUid: 'driver_dev_bypass',
        email: 'driver@schoolerp.dev',
        fullName: 'John Driver',
        role: 'driver',
        rollNoOrUSN: '',
        scope: '{}',
      },
      {
        id: 'student_dev_bypass',
        firebaseUid: 'student_dev_bypass',
        email: 'alex.student@schoolerp.dev',
        fullName: 'Alex Johnson',
        role: 'student',
        rollNoOrUSN: 'STU001',
        scope: '{}',
      },
      {
        id: 'parent_dev_bypass',
        firebaseUid: 'parent_dev_bypass',
        email: 'parent@schoolerp.dev',
        fullName: 'Robert Johnson',
        role: 'parent',
        rollNoOrUSN: '',
        scope: JSON.stringify({ linkedStudentUSN: 'STU001' }),
      },
    ];

    for (const u of usersToSeed) {
      await client.query(`
        INSERT INTO users (id, firebase_uid, email, full_name, role, institution_code, institution_name, institution_type, roll_no_usn, scope, profile_completed, must_change_password)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, true, false)
        ON CONFLICT (firebase_uid) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            institution_code = EXCLUDED.institution_code,
            institution_name = EXCLUDED.institution_name,
            roll_no_usn = EXCLUDED.roll_no_usn,
            scope = EXCLUDED.scope;
      `, [u.id, u.firebaseUid, u.email, u.fullName, u.role, institutionCode, institutionName, 'school', u.rollNoOrUSN, u.scope]);
    }
    console.log('[Seed Transport] Dev bypass users verified (driver, student, parent).');

    // 4. Bus Vehicle
    const vehicleId = 'veh_dev_01';
    const regNo = 'KA-01-AB-1234';
    await client.query(`
      INSERT INTO bus_vehicles (id, institution_code, registration_no, capacity, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (institution_code, registration_no) DO UPDATE
      SET capacity = EXCLUDED.capacity,
          status = EXCLUDED.status;
    `, [vehicleId, institutionCode, regNo, 30, 'active']);
    console.log(`[Seed Transport] Bus vehicle verified (${regNo}).`);

    // 5. Bus Route
    const routeId = 'route_dev_01';
    const routeName = 'Route 4 - Indiranagar to Greenwood Campus';
    const existingRoute = await client.query('SELECT id FROM bus_routes WHERE id = $1', [routeId]);
    if (existingRoute.rows.length === 0) {
      await client.query(`
        INSERT INTO bus_routes (id, institution_code, name, vehicle_id, driver_id)
        VALUES ($1, $2, $3, $4, $5);
      `, [routeId, institutionCode, routeName, vehicleId, 'driver_dev_bypass']);
    } else {
      await client.query(`
        UPDATE bus_routes
        SET institution_code = $2, name = $3, vehicle_id = $4, driver_id = $5, updated_at = NOW()
        WHERE id = $1;
      `, [routeId, institutionCode, routeName, vehicleId, 'driver_dev_bypass']);
    }
    console.log(`[Seed Transport] Bus route verified (${routeName}).`);

    // 6. Bus Stops (5 Bangalore Stops)
    const stops = [
      { id: 'stop_dev_01', name: 'Indiranagar Metro Station', lat: '12.9783692', lng: '77.6408356', seq: 1 },
      { id: 'stop_dev_02', name: 'Domlur Flyover', lat: '12.9609859', lng: '77.6387320', seq: 2 },
      { id: 'stop_dev_03', name: 'Koramangala Sony Signal', lat: '12.9345330', lng: '77.6265790', seq: 3 },
      { id: 'stop_dev_04', name: 'HSR Layout BDA Complex', lat: '12.9116225', lng: '77.6388625', seq: 4 },
      { id: 'stop_dev_05', name: 'Greenwood High Campus', lat: '12.8718000', lng: '77.7496000', seq: 5 },
    ];

    for (const stop of stops) {
      const existingStop = await client.query('SELECT id FROM bus_stops WHERE id = $1', [stop.id]);
      if (existingStop.rows.length === 0) {
        await client.query(`
          INSERT INTO bus_stops (id, institution_code, route_id, name, latitude, longitude, sequence)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [stop.id, institutionCode, routeId, stop.name, stop.lat, stop.lng, stop.seq]);
      } else {
        await client.query(`
          UPDATE bus_stops
          SET institution_code = $2, route_id = $3, name = $4, latitude = $5, longitude = $6, sequence = $7
          WHERE id = $1;
        `, [stop.id, institutionCode, routeId, stop.name, stop.lat, stop.lng, stop.seq]);
      }
    }
    console.log(`[Seed Transport] ${stops.length} Bangalore bus stops verified.`);

    // 7. Student Transport Assignment
    const stId = 'st_dev_01';
    await client.query(`
      INSERT INTO student_transport (id, institution_code, student_id, route_id, stop_id, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (student_id, route_id) DO UPDATE
      SET stop_id = EXCLUDED.stop_id,
          is_active = EXCLUDED.is_active,
          updated_at = NOW();
    `, [stId, institutionCode, 'student_dev_bypass', routeId, 'stop_dev_01']);
    console.log('[Seed Transport] Student transport assignment verified.');

    console.log('[Seed Transport SUCCESS] All transport entities seeded successfully!');
  } catch (err: any) {
    console.error('[Seed Transport ERROR]', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedTransport();
