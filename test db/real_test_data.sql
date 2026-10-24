-- ============================================================================
-- BUS TRACKING MODULE - REAL GPS TEST DATA
-- Folder: test db
-- File: real_test_data.sql
-- Description: Real bus stop coordinates in Mangalore (Thokottu to Yenepoya).
--              Uses institution code REAL001 and ID prefix 'real_' to stay
--              fully isolated from existing TST001 test data.
--
-- Route: Thokottu -> Babbukatte -> Kuthar -> Yenepoya
-- City: Mangalore, Karnataka, India
--
-- Safe to re-run: cleans REAL001 data at the top before inserting.
-- ============================================================================

BEGIN;

-- 0. CLEANUP PREVIOUS REAL TEST DATA
DELETE FROM bus_locations     WHERE trip_id IN (SELECT id FROM bus_trips WHERE institution_code = 'REAL001');
DELETE FROM bus_trips         WHERE institution_code = 'REAL001';
DELETE FROM student_transport WHERE institution_code = 'REAL001';
DELETE FROM bus_stops         WHERE institution_code = 'REAL001';
DELETE FROM bus_routes        WHERE institution_code = 'REAL001';
DELETE FROM bus_vehicles      WHERE institution_code = 'REAL001';


-- 1. INSTITUTION
INSERT INTO institutions (id, institution_code, institution_name, institution_type, subscription_status)
VALUES (
  'inst_real001',
  'REAL001',
  'Yenepoya University',
  'university',
  'active'
)
ON CONFLICT (institution_code) DO UPDATE
SET institution_name    = EXCLUDED.institution_name,
    institution_type    = EXCLUDED.institution_type,
    subscription_status = EXCLUDED.subscription_status;


-- 2. USERS  (Driver, Student, Parent)
INSERT INTO users (
  id, firebase_uid, email, full_name, role,
  institution_code, institution_name, institution_type,
  roll_no_usn, scope, profile_completed, must_change_password
)
VALUES
  -- Drivers
  (
    'real_driver_01',
    'real_driver_01',
    'real.driver@schoolerp.dev',
    'safwan suratkal Dent',
    'driver',
    'REAL001',
    'Yenepoya University',
    'university',
    '',
    '{}'::jsonb,
    true,
    false
  ),
  (
    'driver_dev_bypass',
    'driver_dev_bypass',
    'driver@schoolerp.dev',
    'safwan suratkal Dent',
    'driver',
    'REAL001',
    'Yenepoya University',
    'university',
    '',
    '{}'::jsonb,
    true,
    false
  ),
  -- Students (boards at Babbukatte - stop 2)
  (
    'real_student_01',
    'real_student_01',
    'real.student@schoolerp.dev',
    'naseeb decor oondiye',
    'student',
    'REAL001',
    'Yenepoya University',
    'university',
    'YU2024001',
    '{"classSectionId": "cls_bsc1", "grade": "1", "section": "A"}'::jsonb,
    true,
    false
  ),
  (
    'student_dev_bypass',
    'student_dev_bypass',
    'alex.student@schoolerp.dev',
    'naseeb decor oondiye',
    'student',
    'REAL001',
    'Yenepoya University',
    'university',
    'YU2024001',
    '{"classSectionId": "cls_bsc1", "grade": "1", "section": "A"}'::jsonb,
    true,
    false
  ),
  -- Parents (linked to student above)
  (
    'real_parent_01',
    'real_parent_01',
    'real.parent@schoolerp.dev',
    'Suresh Kumar',
    'parent',
    'REAL001',
    'Yenepoya University',
    'university',
    '',
    '{"linkedStudentUSN": "YU2024001", "studentName": "naseeb decor oondiye"}'::jsonb,
    true,
    false
  ),
  (
    'parent_dev_bypass',
    'parent_dev_bypass',
    'parent@schoolerp.dev',
    'Suresh Kumar',
    'parent',
    'REAL001',
    'Yenepoya University',
    'university',
    '',
    '{"linkedStudentUSN": "YU2024001", "studentName": "naseeb decor oondiye"}'::jsonb,
    true,
    false
  )
ON CONFLICT (firebase_uid) DO UPDATE
SET email             = EXCLUDED.email,
    full_name         = EXCLUDED.full_name,
    role              = EXCLUDED.role,
    institution_code  = EXCLUDED.institution_code,
    institution_name  = EXCLUDED.institution_name,
    roll_no_usn       = EXCLUDED.roll_no_usn,
    scope             = EXCLUDED.scope,
    profile_completed = true;


-- 3. BUS VEHICLE
INSERT INTO bus_vehicles (id, institution_code, registration_no, capacity, status)
VALUES (
  'real_veh_01',
  'REAL001',
  'KA-19-AA-0001',
  40,
  'active'
)
ON CONFLICT (institution_code, registration_no) DO UPDATE
SET capacity   = EXCLUDED.capacity,
    status     = EXCLUDED.status,
    updated_at = NOW();


-- 4. BUS ROUTE  (Thokottu to Yenepoya)
-- Assigned to the demo driver for immediate mobile app testing
INSERT INTO bus_routes (id, institution_code, name, vehicle_id, driver_id)
VALUES (
  'real_route_01',
  'REAL001',
  'Route 1 - Thokottu to Yenepoya Campus',
  'real_veh_01',
  'driver_dev_bypass'
)
ON CONFLICT (id) DO UPDATE
SET name       = EXCLUDED.name,
    vehicle_id = EXCLUDED.vehicle_id,
    driver_id  = EXCLUDED.driver_id,
    updated_at = NOW();


-- 5. BUS STOPS  (4 real GPS stops in Mangalore)
INSERT INTO bus_stops (id, institution_code, route_id, name, latitude, longitude, sequence)
VALUES
  ('real_stop_01', 'REAL001', 'real_route_01', 'Thokottu',      12.818334, 74.860300, 1),
  ('real_stop_02', 'REAL001', 'real_route_01', 'Babbukatte',    12.819260, 74.867458, 2),
  ('real_stop_03', 'REAL001', 'real_route_01', 'Kuthar',        12.819367, 74.878597, 3),
  ('real_stop_04', 'REAL001', 'real_route_01', 'Yenepoya Stop', 12.812161, 74.882096, 4)
ON CONFLICT (id) DO UPDATE
SET name      = EXCLUDED.name,
    latitude  = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    sequence  = EXCLUDED.sequence;


-- 6. STUDENT TRANSPORT ASSIGNMENT
-- Naseeb Decor boards at Babbukatte (stop 2)
INSERT INTO student_transport (id, institution_code, student_id, route_id, stop_id, is_active)
VALUES 
  ('real_st_01', 'REAL001', 'student_dev_bypass', 'real_route_01', 'real_stop_02', true),
  ('real_st_02', 'REAL001', 'real_student_01',    'real_route_01', 'real_stop_02', true)
ON CONFLICT (student_id, route_id) DO UPDATE
SET stop_id    = EXCLUDED.stop_id,
    is_active  = EXCLUDED.is_active,
    updated_at = NOW();


-- 7. LIVE BUS TRIP  (starts at Thokottu, status = live)
INSERT INTO bus_trips (id, institution_code, route_id, driver_id, trip_type, status, started_at)
VALUES (
  'real_trip_live_01',
  'REAL001',
  'real_route_01',
  'driver_dev_bypass',
  'pickup',
  'live',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET status     = 'live',
    trip_type  = 'pickup',
    started_at = NOW(),
    ended_at   = NULL;


-- 8. INITIAL BUS LOCATION  (bus placed at Thokottu, stop 1)
INSERT INTO bus_locations (trip_id, latitude, longitude, speed, heading, updated_at)
VALUES (
  'real_trip_live_01',
  12.818334,   -- Thokottu latitude
  74.860300,   -- Thokottu longitude
  0.00,        -- stationary at start
  90.00,       -- heading East (towards Babbukatte)
  NOW()
)
ON CONFLICT (trip_id) DO UPDATE
SET latitude   = EXCLUDED.latitude,
    longitude  = EXCLUDED.longitude,
    speed      = EXCLUDED.speed,
    heading    = EXCLUDED.heading,
    updated_at = NOW();


COMMIT;


-- ============================================================================
-- VERIFICATION  (all counts should be >= 1 after a successful run)
-- ============================================================================
SELECT 'institutions'       AS table_name, count(*) AS row_count FROM institutions      WHERE institution_code = 'REAL001'
UNION ALL
SELECT 'bus_vehicles',      count(*) FROM bus_vehicles    WHERE institution_code = 'REAL001'
UNION ALL
SELECT 'bus_routes',        count(*) FROM bus_routes      WHERE institution_code = 'REAL001'
UNION ALL
SELECT 'bus_stops',         count(*) FROM bus_stops       WHERE institution_code = 'REAL001'
UNION ALL
SELECT 'student_transport', count(*) FROM student_transport WHERE institution_code = 'REAL001'
UNION ALL
SELECT 'bus_trips',         count(*) FROM bus_trips       WHERE institution_code = 'REAL001'
UNION ALL
SELECT 'bus_locations',     count(*) FROM bus_locations   WHERE trip_id = 'real_trip_live_01';


-- ============================================================================
-- QUICK REFERENCE
-- ============================================================================
--
--  Role     | firebase_uid / id   | Email
--  ---------|---------------------|-------------------------------
--  Driver   | real_driver_01      | real.driver@schoolerp.dev
--  Student  | real_student_01     | real.student@schoolerp.dev
--  Parent   | real_parent_01      | real.parent@schoolerp.dev
--
--  Route:   Route 1 - Thokottu to Yenepoya Campus  (real_route_01)
--  Vehicle: KA-19-AA-0001  (real_veh_01)
--  Trip:    real_trip_live_01  (status = live, pickup)
--
--  Stop sequence:
--    1. Thokottu       12.818334, 74.860300  <- bus starts here
--    2. Babbukatte     12.819260, 74.867458  <- Naseeb boards here (student stop)
--    3. Kuthar         12.819367, 74.878597
--    4. Yenepoya Stop  12.812161, 74.882096  <- final destination
--
--  Geofence testing (150m radius):
--    -> Update bus_locations SET latitude=12.819260, longitude=74.867458
--       GET /transport/my-bus -> currentStop = 'Babbukatte', stopsRemaining = 0
--    -> Update to 12.818334, 74.860300 (Thokottu)
--       GET /transport/my-bus -> currentStop = 'Thokottu', stopsRemaining = 1
--    -> Update to some mid-road coordinate far from all stops
--       GET /transport/my-bus -> currentStop = null (in transit)
-- ============================================================================
