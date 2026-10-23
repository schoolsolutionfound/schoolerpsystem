-- ============================================================================
-- BUS TRACKING MODULE - TEST DATA CLEANUP / ROLLBACK SCRIPT
-- Folder: test db
-- File: delete_test_data.sql
-- Description: Removes all test data inserted for bus tracking module testing
--              prior to deploying to production.
-- Execution: Run via psql, DBeaver, or pg client against the database.
-- ============================================================================

BEGIN;

-- 1. DELETE BUS LOCATIONS (Child of bus_trips)
DELETE FROM bus_locations 
WHERE trip_id IN (
  SELECT id FROM bus_trips WHERE institution_code = 'TST001'
) OR trip_id LIKE 'trip_test_%' OR trip_id LIKE 'bt_%';


-- 2. DELETE BUS TRIPS (Child of bus_routes)
DELETE FROM bus_trips 
WHERE institution_code = 'TST001'
   OR id LIKE 'trip_test_%' 
   OR id LIKE 'bt_%';


-- 3. DELETE STUDENT TRANSPORT ASSIGNMENTS (Child of bus_routes and bus_stops)
DELETE FROM student_transport 
WHERE institution_code = 'TST001'
   OR id LIKE 'st_test_%' 
   OR id LIKE 'st_dev_%';


-- 4. DELETE BUS STOPS (Child of bus_routes)
DELETE FROM bus_stops 
WHERE institution_code = 'TST001'
   OR id LIKE 'stop_test_%' 
   OR id LIKE 'stop_dev_%';


-- 5. DELETE BUS ROUTES (Child of bus_vehicles and users)
DELETE FROM bus_routes 
WHERE institution_code = 'TST001'
   OR id LIKE 'route_test_%' 
   OR id LIKE 'route_dev_%';


-- 6. DELETE BUS VEHICLES
DELETE FROM bus_vehicles 
WHERE institution_code = 'TST001'
   OR id LIKE 'veh_test_%' 
   OR id LIKE 'veh_dev_%';


-- 7. DELETE TEST USERS (Dev Bypass accounts)
-- Note: Comment out if you still want to preserve bypass logins in local development
DELETE FROM users 
WHERE institution_code = 'TST001' 
  AND id IN ('driver_dev_bypass', 'student_dev_bypass', 'parent_dev_bypass');


-- 8. DELETE TEST INSTITUTION (TST001)
-- Note: Comment out if other local tests rely on Greenwood High School (TST001)
DELETE FROM institutions 
WHERE institution_code = 'TST001';

COMMIT;

-- Verification check query (All should return 0)
SELECT 'bus_vehicles' as table_name, count(*) as remaining_rows FROM bus_vehicles WHERE institution_code = 'TST001'
UNION ALL
SELECT 'bus_routes', count(*) FROM bus_routes WHERE institution_code = 'TST001'
UNION ALL
SELECT 'bus_stops', count(*) FROM bus_stops WHERE institution_code = 'TST001'
UNION ALL
SELECT 'student_transport', count(*) FROM student_transport WHERE institution_code = 'TST001'
UNION ALL
SELECT 'bus_trips', count(*) FROM bus_trips WHERE institution_code = 'TST001'
UNION ALL
SELECT 'bus_locations', count(*) FROM bus_locations WHERE trip_id LIKE 'trip_test_%' OR trip_id LIKE 'bt_%';
