/**
 * Per-request timing marks for diagnosing slow hops (auth, login-sync, ...).
 * The server binds a handle per request in an AsyncLocalStorage scope; service
 * code calls `markPhase()` and the onResponse hook emits one log line when the
 * total or any phase exceeds the threshold. Zero cost when nothing is bound.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

const DEFAULT_SLOW_REQUEST_MS = 1000;

export function slowRequestThresholdMs(): number {
  const configured = Number(process.env.SLOW_REQUEST_LOG_MS ?? DEFAULT_SLOW_REQUEST_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_SLOW_REQUEST_MS;
}

export class RequestProfiler {
  private readonly startedAt = process.hrtime.bigint();
  private last = this.startedAt;
  private readonly phases: Record<string, number> = {};

  constructor(
    readonly method: string,
    readonly url: string
  ) {}

  /** Records the milliseconds elapsed since the previous mark (or request start). */
  mark(phase: string) {
    const now = process.hrtime.bigint();
    this.phases[phase] = Number(now - this.last) / 1e6;
    this.last = now;
  }

  totalMs(): number {
    return Number(process.hrtime.bigint() - this.startedAt) / 1e6;
  }

  hasPhases(): boolean {
    return Object.keys(this.phases).length > 0;
  }

  /** Rounds phases so log lines stay readable. */
  snapshot(): { totalMs: number; phases: Record<string, number> } {
    const phases: Record<string, number> = {};
    for (const [key, value] of Object.entries(this.phases)) phases[key] = Math.round(value);
    return { totalMs: Math.round(this.totalMs()), phases };
  }

  isSlow(threshold = slowRequestThresholdMs()): boolean {
    if (this.totalMs() >= threshold) return true;
    return Object.values(this.phases).some((value) => value >= threshold);
  }

  /** The slowest phase, or null when nothing was marked. */
  slowestPhase(): string | null {
    let slowest: string | null = null;
    let max = -1;
    for (const [key, value] of Object.entries(this.phases)) {
      if (value > max) {
        max = value;
        slowest = key;
      }
    }
    return slowest;
  }
}

const profilerStorage = new AsyncLocalStorage<RequestProfiler>();

/** Runs the rest of the request inside a scope bound to `profiler`. */
export function runWithProfiler<T>(profiler: RequestProfiler, fn: () => T): T {
  return profilerStorage.run(profiler, fn);
}

/** Records a phase on the profiler bound to the current request, if any. */
export function markPhase(phase: string) {
  profilerStorage.getStore()?.mark(phase);
}
