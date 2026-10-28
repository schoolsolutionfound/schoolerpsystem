import { queryClient } from './index.js';

const DEFAULT_INTERVAL_MS = 4 * 60 * 1000;

let timer: NodeJS.Timeout | null = null;
let inFlight = false;

async function pingDatabase() {
  if (!queryClient || inFlight) return;
  inFlight = true;
  try {
    await queryClient.unsafe('select 1');
  } catch (error: any) {
    console.warn('[DB Keep-Alive] Ping failed:', error.message);
  } finally {
    inFlight = false;
  }
}

export function startDbKeepAlive() {
  if (!queryClient || timer) return;

  const configured = Number(process.env.DB_KEEPALIVE_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
  if (!Number.isFinite(configured) || configured <= 0) {
    console.log('[DB Keep-Alive] Disabled');
    return;
  }

  void pingDatabase();
  timer = setInterval(() => {
    void pingDatabase();
  }, configured);
  timer.unref();

  console.log(`[DB Keep-Alive] Enabled (${configured}ms interval)`);
}

export function stopDbKeepAlive() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
