/**
 * Automated Bus Simulator Script
 *
 * Moves a virtual bus along the driver's route stop sequence,
 * smoothly interpolating coordinates, calculating heading, and posting to the backend.
 *
 * Usage:
 *   npx tsx scripts/simulate-bus.ts [options]
 *
 * Options:
 *   --speed <number>    Speed in km/h (default: 30)
 *   --interval <number> Update interval in seconds (default: 2)
 *   --loop              Loop back to the first stop upon reaching the end
 *   --no-end            Keep the trip active at the final stop instead of ending it
 *   --jitter            Add random GPS noise (approx ±5 meters)
 */

import { haversineDistanceKm } from '../src/modules/transport/transport.utils.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1/transport';
const DRIVER_TOKEN = process.env.TEST_DRIVER_TOKEN || '';
if (!DRIVER_TOKEN) {
  console.error('Set TEST_DRIVER_TOKEN to a valid Firebase ID token.');
  process.exit(1);
}

// Parse CLI flags
const args = process.argv.slice(2);
function getArgValue(flag: string, fallback: string): string {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return fallback;
}

const speedKmH = parseFloat(getArgValue('--speed', '30')) || 30;
const intervalSec = parseFloat(getArgValue('--interval', '2')) || 2;
const isLoop = args.includes('--loop');
const noEnd = args.includes('--no-end');
const hasJitter = args.includes('--jitter');

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

let activeTripId: string | null = null;
let isShuttingDown = false;

// Compute initial bearing in degrees (0 - 360)
function calculateHeading(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  const bearing = (toDeg(θ) + 360) % 360;
  return Math.round(bearing * 10) / 10;
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DRIVER_TOKEN}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function cleanShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n\n🛑 Caught termination signal. Gracefully ending live trip...');
  if (activeTripId) {
    try {
      await request(`/driver/trips/${activeTripId}/end`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      console.log(`✅ Trip ${activeTripId} ended successfully.`);
    } catch (err: any) {
      console.error(`⚠️ Failed to end trip ${activeTripId}:`, err.message);
    }
  }
  process.exit(0);
}

process.on('SIGINT', cleanShutdown);
process.on('SIGTERM', cleanShutdown);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startSimulation() {
  console.log('========================================================');
  console.log('🚌 School Bus Realtime GPS Simulator');
  console.log(`🎯 API Base:    ${BASE_URL}`);
  console.log(`⚡ Speed:       ${speedKmH} km/h`);
  console.log(`⏱️ Interval:    ${intervalSec}s`);
  console.log(`🔁 Loop:        ${isLoop ? 'YES' : 'NO'}`);
  console.log(`🏁 No-End:      ${noEnd ? 'YES' : 'NO'}`);
  console.log(`📡 GPS Jitter:  ${hasJitter ? 'ENABLED (±5m)' : 'DISABLED'}`);
  console.log('========================================================\n');

  // Step 1: Query driver assignment
  console.log('Fetching driver assignment and route stops...');
  const assignRes = await request('/driver/assignment');
  if (assignRes.status !== 200 || !assignRes.data?.data) {
    console.error('❌ Failed to fetch driver assignment:', assignRes.data);
    process.exit(1);
  }

  const { route, stops, liveTrip } = assignRes.data.data;
  if (!route || !stops || stops.length === 0) {
    console.error('❌ Driver has no assigned route or stops to simulate.');
    process.exit(1);
  }

  // End existing active trip if any
  if (liveTrip) {
    console.log(`⚠️ Driver already has active trip (${liveTrip.id}). Ending it before starting simulation...`);
    await request(`/driver/trips/${liveTrip.id}/end`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    await sleep(500);
  }

  // Sort stops by sequence
  const sortedStops: Stop[] = stops.map((s: any) => ({
    id: s.id,
    name: s.name,
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
    sequence: Number(s.sequence),
  })).sort((a: Stop, b: Stop) => a.sequence - b.sequence);

  console.log(`✅ Route loaded: "${route.name}" with ${sortedStops.length} stops:`);
  sortedStops.forEach((s) => {
    console.log(`   [Stop ${s.sequence}] ${s.name} (${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)})`);
  });

  // Step 2: Start Trip
  console.log('\nStarting new live trip (pickup)...');
  const startRes = await request('/driver/trips/start', {
    method: 'POST',
    body: JSON.stringify({ tripType: 'pickup' }),
  });

  if (startRes.status !== 201 || !startRes.data?.data?.id) {
    console.error('❌ Failed to start live trip:', startRes.data);
    process.exit(1);
  }

  activeTripId = startRes.data.data.id;
  console.log(`🚀 Live trip started! ID: ${activeTripId}`);
  console.log('Broadcasting position updates... (Press Ctrl+C to stop anytime)\n');

  // Distance per interval: (speedKmH / 3600) * intervalSec km
  const kmPerInterval = (speedKmH / 3600) * intervalSec;

  do {
    for (let i = 0; i < sortedStops.length - 1; i++) {
      const fromStop = sortedStops[i];
      const toStop = sortedStops[i + 1];

      const legDistanceKm = haversineDistanceKm(
        fromStop.latitude,
        fromStop.longitude,
        toStop.latitude,
        toStop.longitude
      );

      const heading = calculateHeading(
        fromStop.latitude,
        fromStop.longitude,
        toStop.latitude,
        toStop.longitude
      );

      const totalSteps = Math.max(1, Math.ceil(legDistanceKm / kmPerInterval));
      console.log(`\n📍 En route from Stop ${fromStop.sequence} ("${fromStop.name}") ➔ Stop ${toStop.sequence} ("${toStop.name}")`);
      console.log(`   Distance: ${legDistanceKm.toFixed(2)} km | Est. Steps: ${totalSteps} (${(totalSteps * intervalSec).toFixed(0)}s) | Heading: ${heading}°`);

      for (let step = 0; step <= totalSteps; step++) {
        if (isShuttingDown) return;

        const fraction = step / totalSteps;
        let lat = fromStop.latitude + fraction * (toStop.latitude - fromStop.latitude);
        let lng = fromStop.longitude + fraction * (toStop.longitude - fromStop.longitude);

        if (hasJitter) {
          // Approx 0.00004 deg is ~4.5 meters
          lat += (Math.random() - 0.5) * 0.00008;
          lng += (Math.random() - 0.5) * 0.00008;
        }

        const currentSpeed = (step === 0 || step === totalSteps) ? Math.round(speedKmH * 0.5) : speedKmH;

        const locRes = await request(`/driver/trips/${activeTripId}/location`, {
          method: 'POST',
          body: JSON.stringify({
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6)),
            speed: currentSpeed,
            heading,
          }),
        });

        if (locRes.status !== 200) {
          console.warn(`   ⚠️ Location post returned ${locRes.status}:`, locRes.data);
        } else {
          console.log(
            `   [GPS POST] ${Math.round(fraction * 100)}% | Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} | Speed: ${currentSpeed} km/h | Heading: ${heading}°`
          );
        }

        if (step < totalSteps) {
          await sleep(intervalSec * 1000);
        }
      }

      // Small pause at arrival of each stop
      console.log(`   🔔 Arrived at Stop ${toStop.sequence} ("${toStop.name}")`);
      await sleep(1500);
    }

    if (isLoop) {
      console.log('\n🔁 Reached final stop in loop mode. Restarting from stop 1 in 3 seconds...');
      await sleep(3000);
    }
  } while (isLoop && !isShuttingDown);

  // Reached end of route
  if (noEnd) {
    console.log('\n🏁 Reached final destination. `--no-end` specified; keeping trip alive. Press Ctrl+C to terminate.');
    while (!isShuttingDown) {
      await sleep(5000);
    }
  } else {
    console.log('\n🏁 Reached final destination. Ending live trip...');
    await request(`/driver/trips/${activeTripId}/end`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    console.log(`✅ Live trip ${activeTripId} ended cleanly.`);
    activeTripId = null;
  }
}

startSimulation().catch((err) => {
  console.error('Fatal simulator error:', err);
  process.exit(1);
});
