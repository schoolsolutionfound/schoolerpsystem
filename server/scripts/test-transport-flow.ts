/**
 * Integration test script for School ERP Transport Flow
 * Runnable with tsx against a running local server and seeded data:
 * npx tsx scripts/test-transport-flow.ts
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1/transport';
const DRIVER_TOKEN = 'dev-hardcoded-driver-token';
const STUDENT_TOKEN = 'dev-hardcoded-student-token';
const PARENT_TOKEN = 'dev-hardcoded-parent-token';

let passedChecks = 0;
let failedChecks = 0;

function assertCheck(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passedChecks++;
  } else {
    console.error(`  [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
    failedChecks++;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function run() {
  console.log('====================================================');
  console.log('🧪 Starting Transport Flow Integration Test Suite');
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log('====================================================\n');

  // Step 0: Ensure any existing active trip for driver is ended first (clean state)
  const assignCheck = await request('/driver/assignment', {
    headers: { Authorization: `Bearer ${DRIVER_TOKEN}` },
  });
  if (assignCheck.data?.data?.liveTrip) {
    const existingTripId = assignCheck.data.data.liveTrip.id;
    console.log(`Cleaning up existing active trip (${existingTripId})...`);
    await request(`/driver/trips/${existingTripId}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${DRIVER_TOKEN}` },
      body: JSON.stringify({}),
    });
  }

  // Check 1: Start a trip as driver
  console.log('Step 1: Starting new live pickup trip...');
  const startRes = await request('/driver/trips/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DRIVER_TOKEN}` },
    body: JSON.stringify({ tripType: 'pickup' }),
  });

  assertCheck('Driver start trip returns 201', startRes.status === 201, `Status: ${startRes.status}`);
  const trip = startRes.data?.data;
  assertCheck('Trip object contains id and status "live"', trip?.id && trip?.status === 'live');
  const tripId = trip?.id;

  if (!tripId) {
    console.error('Fatal: Cannot continue without valid tripId');
    process.exit(1);
  }

  // Check 2: Verify duplicate start is rejected (400 or 409 Conflict)
  console.log('\nStep 2: Verifying duplicate start rejection...');
  const dupStartRes = await request('/driver/trips/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DRIVER_TOKEN}` },
    body: JSON.stringify({ tripType: 'pickup' }),
  });
  assertCheck(
    'Second trip start rejected (HTTP 400/409 ACTIVE_TRIP_EXISTS)',
    (dupStartRes.status === 400 || dupStartRes.status === 409) &&
      dupStartRes.data?.error?.code === 'ACTIVE_TRIP_EXISTS',
    `Status: ${dupStartRes.status}, Code: ${dupStartRes.data?.error?.code}`
  );

  // Check 3: Verify bad coordinates rejection (400 Bad Request)
  console.log('\nStep 3: Verifying invalid coordinate validation...');
  const badLocRes = await request(`/driver/trips/${tripId}/location`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DRIVER_TOKEN}` },
    body: JSON.stringify({
      latitude: 125.0, // Invalid lat > 90
      longitude: 77.64,
      speed: 30,
      heading: 180,
    }),
  });
  assertCheck(
    'Bad latitude (>90) rejected with 400',
    badLocRes.status === 400,
    `Status: ${badLocRes.status}`
  );

  const badLngRes = await request(`/driver/trips/${tripId}/location`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DRIVER_TOKEN}` },
    body: JSON.stringify({
      latitude: 12.97,
      longitude: -195.0, // Invalid lng < -180
      speed: 30,
    }),
  });
  assertCheck(
    'Bad longitude (<-180) rejected with 400',
    badLngRes.status === 400,
    `Status: ${badLngRes.status}`
  );

  // Check 4: Post location along stop 1 (Indiranagar Metro)
  console.log('\nStep 4: Posting location near Stop 1 (Indiranagar)...');
  const loc1 = await request(`/driver/trips/${tripId}/location`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DRIVER_TOKEN}` },
    body: JSON.stringify({
      latitude: 12.9783692,
      longitude: 77.6408356,
      speed: 25.0,
      heading: 170.0,
    }),
  });
  assertCheck('Location near Stop 1 posted successfully', loc1.status === 200, `Status: ${loc1.status}`);

  // Check 5: Student /my-bus query
  console.log('\nStep 5: Verifying /my-bus as Student...');
  const studentBus1 = await request('/my-bus', {
    headers: { Authorization: `Bearer ${STUDENT_TOKEN}` },
  });
  assertCheck('Student /my-bus returns 200', studentBus1.status === 200);
  const stuData1 = studentBus1.data?.data;
  assertCheck('Student sees isLive === true', stuData1?.isLive === true);
  assertCheck('Student sees location object matching posted coordinates', 
    Math.abs(Number(stuData1?.location?.latitude) - 12.9783692) < 0.0001
  );
  assertCheck('Student currentStop is Stop 1 (Indiranagar Metro Station)',
    stuData1?.currentStop?.name === 'Indiranagar Metro Station'
  );
  assertCheck('Student stopsRemaining === 0 (at boarding stop)', stuData1?.stopsRemaining === 0);

  // Check 6: Parent /my-bus query
  console.log('\nStep 6: Verifying /my-bus as Parent...');
  const parentBus1 = await request('/my-bus', {
    headers: { Authorization: `Bearer ${PARENT_TOKEN}` },
  });
  assertCheck('Parent /my-bus returns 200', parentBus1.status === 200);
  const parData1 = parentBus1.data?.data;
  assertCheck('Parent sees isLive === true', parData1?.isLive === true);
  assertCheck('Parent sees child route & currentStop', parData1?.currentStop?.name === 'Indiranagar Metro Station');
  assertCheck('Parent sees location object', !!parData1?.location?.latitude);

  // Check 7: Post location near Stop 2 (Domlur Flyover)
  console.log('\nStep 7: Moving bus to Stop 2 (Domlur Flyover)...');
  const loc2 = await request(`/driver/trips/${tripId}/location`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DRIVER_TOKEN}` },
    body: JSON.stringify({
      latitude: 12.9609859,
      longitude: 77.6387320,
      speed: 35.0,
      heading: 175.0,
    }),
  });
  assertCheck('Location near Stop 2 posted successfully', loc2.status === 200);

  const studentBus2 = await request('/my-bus', {
    headers: { Authorization: `Bearer ${STUDENT_TOKEN}` },
  });
  const stuData2 = studentBus2.data?.data;
  assertCheck('currentStop updated to Domlur Flyover', stuData2?.currentStop?.name === 'Domlur Flyover');
  // Since student stop was sequence 1, and bus is now at sequence 2, stopsRemaining should be -1 (passed)
  assertCheck('stopsRemaining is -1 (bus passed student stop)', stuData2?.stopsRemaining === -1);

  // Check 8: End Trip
  console.log('\nStep 8: Ending the active trip...');
  const endRes = await request(`/driver/trips/${tripId}/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DRIVER_TOKEN}` },
    body: JSON.stringify({}),
  });
  assertCheck('End trip returns 200', endRes.status === 200, `Status: ${endRes.status}`);

  // Check 9: Post-trip /my-bus assertion
  console.log('\nStep 9: Verifying /my-bus after trip end...');
  const postTripRes = await request('/my-bus', {
    headers: { Authorization: `Bearer ${STUDENT_TOKEN}` },
  });
  assertCheck('Student /my-bus returns 200 after trip end', postTripRes.status === 200);
  const postTripData = postTripRes.data?.data;
  assertCheck('isLive is false after trip end', postTripData?.isLive === false);
  assertCheck('No location returned when trip is not live', postTripData?.location === null);

  // Final Summary
  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passedChecks} PASSED, ${failedChecks} FAILED`);
  console.log('====================================================');

  if (failedChecks > 0) {
    console.error(`❌ Integration tests FAILED with ${failedChecks} error(s).`);
    process.exit(1);
  } else {
    console.log('✅ All integration checks passed successfully!');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
