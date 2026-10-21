-- ============================================================================
-- BUS TRACKING MODULE - TEST DATA INSERTION SCRIPT
-- Folder: test db
-- File: insert_test_data.sql
-- Description: Inserts test institution, users, vehicles, routes, stops,
--              student transport assignments, and an active live trip with GPS.
-- Safe to re-run: Uses ON CONFLICT DO UPDATE / DO NOTHING where applicable.
-- ============================================================================

BEGIN;

-- 0. CLEANUP PREVIOUS TEST / DEV BUS ROWS (Guarantees clean re-run)
DELETE FROM bus_locations WHERE trip_id IN (SELECT id FROM bus_trips WHERE institution_code = 'TST001');
DELETE FROM bus_trips WHERE institution_code = 'TST001';
DELETE FROM student_transport WHERE institution_code = 'TST001';
DELETE FROM bus_stops WHERE institution_code = 'TST001';
DELETE FROM bus_routes WHERE institution_code = 'TST001';
DELETE FROM bus_vehicles WHERE institution_code = 'TST001';

-- 1. TEST INSTITUTION
INSERT INTO institutions (id, institution_code, institution_name, institution_type, subscription_status)
VALUES 
  ('inst_tst001', 'TST001', 'Greenwood High School', 'school', 'active')
ON CONFLICT (institution_code) DO UPDATE
SET institution_name = EXCLUDED.institution_name,
    institution_type = EXCLUDED.institution_type,
    subscription_status = EXCLUDED.subscription_status;


-- 2. TEST USERS (Driver, Student, Parent with Dev Bypass credentials)
INSERT INTO users (
  id, firebase_uid, email, full_name, role, institution_code, 
  institution_name, institution_type, roll_no_usn, scope, 
  profile_completed, must_change_password
)
VALUES 
  (
    'driver_dev_bypass', 
    'driver_dev_bypass', 
    'driver@schoolerp.dev', 
    'John Driver', 
    'driver', 
    'TST001', 
    'Greenwood High School', 
    'school', 
    '', 
    '{}'::jsonb, 
    true, 
    false
  ),
  (
    'student_dev_bypass', 
    'student_dev_bypass', 
    'alex.student@schoolerp.dev', 
    'Alex Johnson', 
    'student', 
    'TST001', 
    'Greenwood High School', 
    'school', 
    'STU001', 
    '{"classSectionId": "cls_10a", "grade": "10", "section": "A"}'::jsonb, 
    true, 
    false
  ),
  (
    'parent_dev_bypass', 
    'parent_dev_bypass', 
    'parent@schoolerp.dev', 
    'Robert Johnson', 
    'parent', 
    'TST001', 
    'Greenwood High School', 
    'school', 
    '', 
    '{"linkedStudentUSN": "STU001", "studentName": "Alex Johnson"}'::jsonb, 
    true, 
    false
  )
ON CONFLICT (firebase_uid) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    institution_code = EXCLUDED.institution_code,
    institution_name = EXCLUDED.institution_name,
    roll_no_usn = EXCLUDED.roll_no_usn,
    scope = EXCLUDED.scope,
    profile_completed = true;


-- 3. BUS VEHICLES
INSERT INTO bus_vehicles (id, institution_code, registration_no, capacity, status)
VALUES 
  ('veh_test_01', 'TST001', 'KA-01-AB-1234', 32, 'active'),
  ('veh_test_02', 'TST001', 'KA-01-CD-5678', 40, 'active')
ON CONFLICT (institution_code, registration_no) DO UPDATE
SET capacity = EXCLUDED.capacity,
    status = EXCLUDED.status,
    updated_at = NOW();


-- 4. BUS ROUTES
-- Route 4: Indiranagar to Greenwood Campus (Assigned to driver_dev_bypass and veh_test_01)
-- Route 8: Whitefield to Greenwood Campus
INSERT INTO bus_routes (id, institution_code, name, vehicle_id, driver_id)
VALUES 
  ('route_test_01', 'TST001', 'Route 4 - Indiranagar to Greenwood Campus', 'veh_test_01', 'driver_dev_bypass'),
  ('route_test_02', 'TST001', 'Route 8 - Whitefield to Greenwood Campus', 'veh_test_02', NULL)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    vehicle_id = EXCLUDED.vehicle_id,
    driver_id = EXCLUDED.driver_id,
    updated_at = NOW();


-- 5. BUS STOPS (Sequenced GPS Coordinates in Bangalore)
-- Stops for Route 4
INSERT INTO bus_stops (id, institution_code, route_id, name, latitude, longitude, sequence)
VALUES 
  ('stop_test_01', 'TST001', 'route_test_01', 'Indiranagar Metro Station', 12.9783692, 77.6408356, 1),
  ('stop_test_02', 'TST001', 'route_test_01', 'Domlur Flyover', 12.9609859, 77.6387320, 2),
  ('stop_test_03', 'TST001', 'route_test_01', 'Koramangala Sony Signal', 12.9345330, 77.6265790, 3),
  ('stop_test_04', 'TST001', 'route_test_01', 'HSR Layout BDA Complex', 12.9116225, 77.6388625, 4),
  ('stop_test_05', 'TST001', 'route_test_01', 'Greenwood High Campus', 12.8718000, 77.7496000, 5),

  -- Stops for Route 8
  ('stop_test_06', 'TST001', 'route_test_02', 'Hope Farm Junction', 12.9839000, 77.7519000, 1),
  ('stop_test_07', 'TST001', 'route_test_02', 'ITPB Main Gate', 12.9863000, 77.7381000, 2),
  ('stop_test_08', 'TST001', 'route_test_02', 'Varthur Kodi', 12.9568000, 77.7335000, 3),
  ('stop_test_09', 'TST001', 'route_test_02', 'Greenwood High Campus', 12.8718000, 77.7496000, 4)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    sequence = EXCLUDED.sequence;


-- 6. STUDENT TRANSPORT ASSIGNMENT
-- Maps student_dev_bypass (Alex Johnson) to Route 4, Stop 1 (Indiranagar Metro Station)
INSERT INTO student_transport (id, institution_code, student_id, route_id, stop_id, is_active)
VALUES 
  ('st_test_01', 'TST001', 'student_dev_bypass', 'route_test_01', 'stop_test_01', true)
ON CONFLICT (student_id, route_id) DO UPDATE
SET stop_id = EXCLUDED.stop_id,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();


-- 7. LIVE BUS TRIP (Ready for immediate tracking tests)
INSERT INTO bus_trips (id, institution_code, route_id, driver_id, trip_type, status, started_at)
VALUES 
  ('trip_test_live_01', 'TST001', 'route_test_01', 'driver_dev_bypass', 'pickup', 'live', NOW())
ON CONFLICT (id) DO UPDATE
SET status = 'live',
    trip_type = 'pickup',
    started_at = NOW(),
    ended_at = NULL;


-- 8. LIVE BUS LOCATION (Initial GPS coordinate near Indiranagar heading south)
INSERT INTO bus_locations (trip_id, latitude, longitude, speed, heading, updated_at)
VALUES 
  ('trip_test_live_01', 12.9783692, 77.6408356, 28.50, 180.00, NOW())
ON CONFLICT (trip_id) DO UPDATE
SET latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    speed = EXCLUDED.speed,
    heading = EXCLUDED.heading,
    updated_at = NOW();

COMMIT;

-- Verification check query
SELECT 'bus_vehicles' as table_name, count(*) as row_count FROM bus_vehicles WHERE institution_code = 'TST001'
UNION ALL
SELECT 'bus_routes', count(*) FROM bus_routes WHERE institution_code = 'TST001'
UNION ALL
SELECT 'bus_stops', count(*) FROM bus_stops WHERE institution_code = 'TST001'
UNION ALL
SELECT 'student_transport', count(*) FROM student_transport WHERE institution_code = 'TST001'
UNION ALL
SELECT 'bus_trips', count(*) FROM bus_trips WHERE institution_code = 'TST001'
UNION ALL
SELECT 'bus_locations', count(*) FROM bus_locations WHERE trip_id = 'trip_test_live_01';
