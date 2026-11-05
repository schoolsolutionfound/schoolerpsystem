import { queryClient } from './index.js';

const DEFAULT_INTERVAL_MS = 4 * 60 * 1000;
const DEFAULT_WARM_CONNECTIONS = 2;
const MAX_WARM_CONNECTIONS = 5;

let timer: NodeJS.Timeout | null = null;
let inFlight = false;

interface HeldConnection {
  unsafe(query: string): Promise<unknown>;
  release(): void;
}

const warmConnections: HeldConnection[] = [];

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

/**
 * Opens and holds a few idle sockets so the first real requests do not pay a
 * multi-second cold dial (TCP + TLS + Neon wake-up). `reserve()` takes the
 * connection out of the pool, so these are kept until shutdown.
 */
async function warmPool() {
  const client = queryClient;
  if (!client || warmConnections.length > 0) return;

  const configured = Number(process.env.DB_WARM_CONNECTIONS ?? DEFAULT_WARM_CONNECTIONS);
  const count =
    Number.isFinite(configured) && configured >= 0
      ? Math.min(configured, MAX_WARM_CONNECTIONS)
      : DEFAULT_WARM_CONNECTIONS;
  if (count === 0) return;

  const startedAt = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: count }, () =>
      client.reserve().then(async (conn) => {
        await conn.unsafe('select 1');
        return conn as unknown as HeldConnection;
      })
    )
  );
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      warmConnections.push(result.value);
    } else {
      console.warn(`[DB Warm Pool] Connection ${index + 1}/${count} failed:`, result.reason?.message);
    }
  });
  console.log(
    `[DB Warm Pool] ${warmConnections.length}/${count} connections ready in ${Date.now() - startedAt}ms`
  );
}

export function startDbKeepAlive() {
  if (!queryClient || timer) return;

  const configured = Number(process.env.DB_KEEPALIVE_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
  if (!Number.isFinite(configured) || configured <= 0) {
    console.log('[DB Keep-Alive] Disabled');
    void warmPool();
    return;
  }

  void warmPool();
  void pingDatabase();
  timer = setInterval(() => {
    void pingDatabase();
  }, configured);
  timer.unref();

  console.log(`[DB Keep-Alive] Enabled (${configured}ms interval)`);
}

export function stopDbKeepAlive() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  while (warmConnections.length > 0) {
    warmConnections.pop()?.release();
  }
}
