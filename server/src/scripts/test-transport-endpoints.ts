async function testEndpoints() {
  const baseUrl = 'http://localhost:5000/api/v1/transport';
  const driverToken = process.env.TEST_DRIVER_TOKEN || '';
  const studentToken = process.env.TEST_STUDENT_TOKEN || '';

  if (!driverToken || !studentToken) {
    console.error('Set TEST_DRIVER_TOKEN and TEST_STUDENT_TOKEN to valid Firebase ID tokens.');
    return;
  }

  console.log('=== TEST 1: Driver Assignment ===');
  const assignRes = await fetch(`${baseUrl}/driver/assignment`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const assignJson = await assignRes.json();
  console.log(JSON.stringify(assignJson, null, 2));

  console.log('\n=== TEST 2: Student My-Bus (Pre-Trip / Not Live) ===');
  const preTripRes = await fetch(`${baseUrl}/my-bus`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const preTripJson = await preTripRes.json();
  console.log(JSON.stringify(preTripJson, null, 2));

  console.log('\n=== TEST 3: Driver Start Trip ===');
  const startRes = await fetch(`${baseUrl}/driver/trips/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${driverToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tripType: 'pickup' }),
  });
  const startJson = await startRes.json();
  console.log(JSON.stringify(startJson, null, 2));
  const tripId = (startJson as any).data?.id;

  if (!tripId) {
    console.error('Failed to get tripId from start response');
    return;
  }

  console.log('\n=== TEST 4: Driver Update Location ===');
  const locRes = await fetch(`${baseUrl}/driver/trips/${tripId}/location`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${driverToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude: 12.9783692,
      longitude: 77.6408356,
      speed: 25.5,
      heading: 180.0,
    }),
  });
  const locJson = await locRes.json();
  console.log(JSON.stringify(locJson, null, 2));

  console.log('\n=== TEST 5: Student My-Bus (During Live Trip) ===');
  const liveRes = await fetch(`${baseUrl}/my-bus`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const liveJson = await liveRes.json();
  console.log(JSON.stringify(liveJson, null, 2));

  console.log('\n=== TEST 6: Driver End Trip ===');
  const endRes = await fetch(`${baseUrl}/driver/trips/${tripId}/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const endJson = await endRes.json();
  console.log(JSON.stringify(endJson, null, 2));

  console.log('\n=== TEST 7: Student My-Bus (After Trip Ended) ===');
  const postTripRes = await fetch(`${baseUrl}/my-bus`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const postTripJson = await postTripRes.json();
  console.log(JSON.stringify(postTripJson, null, 2));
}

testEndpoints().catch((err) => {
  console.error('Error during testing:', err);
});
