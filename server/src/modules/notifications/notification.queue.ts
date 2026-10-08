import { NotificationRecord, PRIORITY_QUEUE_MAP, MAX_RETRY_COUNT, BATCH_SIZE, MAX_BATCHES_PER_SECOND } from './notification.types.js';
import {
  getPendingNotifications,
  markSent,
  markFailed,
  incrementRetry,
  getActiveTokensByUsers,
  deactivateToken,
} from './notification.repository.js';
import { sendExpoPushes, buildPushMessages, processTickets } from './expo.provider.js';

// ============================================================================
// In-Process Notification Queue
//
// Processes pending notifications in batches with priority ordering.
// Designed to handle 5M+ notifications/day on a single server.
//
// For horizontal scaling, replace with Redis + BullMQ:
//   - export an interface-compatible implementation
//   - swap the queue backend without changing callers
// ============================================================================

interface QueueState {
  running: boolean;
  processing: boolean;
  lastProcessTime: number;
  batchesProcessed: number;
  totalSent: number;
  totalFailed: number;
}

const state: QueueState = {
  running: false,
  processing: false,
  lastProcessTime: 0,
  batchesProcessed: 0,
  totalSent: 0,
  totalFailed: 0,
};

const PROCESS_INTERVAL_MS = 1000;
const MAX_NOTIFICATIONS_PER_CYCLE = MAX_BATCHES_PER_SECOND * BATCH_SIZE;
const CAMPAIGN_SWEEP_INTERVAL_MS = 5000;

let processTimer: ReturnType<typeof setInterval> | null = null;
let lastCampaignSweepAt = 0;

export function startNotificationQueue(): void {
  if (state.running) return;
  state.running = true;

  processTimer = setInterval(async () => {
    if (state.processing) return;

    const now = Date.now();
    if (now - state.lastProcessTime < PROCESS_INTERVAL_MS) return;

    state.processing = true;
    state.lastProcessTime = now;

    try {
      await processPendingNotifications();

      // Scheduled campaigns: launch any whose scheduledAt has passed.
      // Imported lazily because the service statically imports this module.
      if (now - lastCampaignSweepAt >= CAMPAIGN_SWEEP_INTERVAL_MS) {
        lastCampaignSweepAt = now;
        const { notificationService } = await import('./notification.service.js');
        await notificationService.processDueCampaigns();
      }
    } catch (error: any) {
      console.error('[Notification Queue] Processing error:', error.message);
    } finally {
      state.processing = false;
    }
  }, 500);

  console.log('[Notification Queue] Started — interval: 500ms, batch size:', BATCH_SIZE);
}

export function stopNotificationQueue(): void {
  if (processTimer) {
    clearInterval(processTimer);
    processTimer = null;
  }
  state.running = false;
  console.log('[Notification Queue] Stopped');
}

export async function processPendingNotifications(): Promise<void> {
  const pending = await getPendingNotifications(MAX_NOTIFICATIONS_PER_CYCLE);
  if (pending.length === 0) return;

  // `push` goes through Expo; `in_app` rows are stored for the UI and close
  // out here. sms/email have no provider configured, so they are marked
  // failed with a clear reason instead of reporting a delivery that never
  // happened.
  const pushRows: NotificationRecord[] = [];
  const inAppIds: string[] = [];
  const unsupportedByChannel = new Map<string, string[]>();
  for (const row of pending) {
    if (row.channel === 'push') pushRows.push(row);
    else if (row.channel === 'in_app') inAppIds.push(row.id);
    else unsupportedByChannel.set(row.channel, [
      ...(unsupportedByChannel.get(row.channel) || []),
      row.id,
    ]);
  }

  if (inAppIds.length > 0) {
    await markSent(inAppIds);
    state.totalSent += inAppIds.length;
  }

  for (const [channel, ids] of unsupportedByChannel) {
    await markFailed(ids, `${channel} delivery not configured — no provider connected`);
    state.totalFailed += ids.length;
    console.warn(`[Notification Queue] Marked ${ids.length} ${channel} notification(s) failed — no provider configured`);
  }

  for (let i = 0; i < pushRows.length; i += BATCH_SIZE) {
    const batch = pushRows.slice(i, i + BATCH_SIZE);
    await processBatch(batch);
    state.batchesProcessed++;
  }
}

/**
 * Apply the retry budget to failed notification ids: keep them `pending`
 * (so the queue retries them) until MAX_RETRY_COUNT is exhausted, then fail
 * them terminally. Returns the number of terminal failures.
 */
async function resolveFailures(ids: string[], batch: NotificationRecord[]): Promise<number> {
  let terminal = 0;
  for (const id of ids) {
    const row = batch.find((n) => n.id === id);
    const attempts = (row?.retryCount ?? 0) + 1;
    if (attempts >= MAX_RETRY_COUNT) {
      await markFailed([id], `Failed after ${MAX_RETRY_COUNT} attempts`);
      terminal++;
    } else {
      await incrementRetry(id);
    }
  }
  return terminal;
}

async function processBatch(batch: NotificationRecord[]): Promise<void> {
  if (batch.length === 0) return;

  const notificationIds = batch.map((n) => n.id);
  const recipientIds = [...new Set(batch.map((n) => n.recipientId))];

  try {
    // 1. Fetch active push tokens for all recipients
    const tokenMap = await getActiveTokensByUsers(recipientIds);

    // 2. Build Expo push messages
    const messages = buildPushMessages(batch, tokenMap);

    if (messages.length === 0) {
      // No tokens — mark all as sent (in-app only)
      await markSent(notificationIds);
      state.totalSent += batch.length;
      return;
    }

    // 3. Send via Expo Push API (batched, 100 per HTTP request)
    const { tickets } = await sendExpoPushes(messages);

    // 4. Process results
    const { sentIds, failedIds, deactivateTokens } = processTickets(batch, tokenMap, tickets);

    // 5. Update notification statuses. Failed deliveries must stay `pending`
    // until the retry budget is exhausted — marking them `failed` right away
    // would remove them from the queue permanently (getPendingNotifications
    // only reads status = 'pending').
    await markSent(sentIds);

    // 6. Deactivate invalid tokens
    for (const token of deactivateTokens) {
      await deactivateToken(token);
    }

    // 7. Apply the retry budget to failures
    const terminalFailures = await resolveFailures(failedIds, batch);

    state.totalSent += sentIds.length;
    state.totalFailed += terminalFailures;
  } catch (error: any) {
    console.error('[Notification Queue] Batch processing error:', error.message);
    // Transient batch failure — apply the same retry budget to the whole batch.
    state.totalFailed += await resolveFailures(notificationIds, batch);
  }
}

export function getQueueStats(): {
  running: boolean;
  processing: boolean;
  batchesProcessed: number;
  totalSent: number;
  totalFailed: number;
} {
  return { ...state };
}

/**
 * Enqueue a notification for immediate processing.
 * In the in-process queue, this is a no-op since the polling loop
 * picks up pending notifications automatically.
 * For Redis/BullMQ, this would add a job to the queue.
 */
export function enqueueNotification(_notificationId: string): void {
  // In-process queue polls the DB, so nothing to do here.
  // For external queue backends, this would publish to Redis.
}

export function enqueueBatch(_notificationIds: string[]): void {
  // See above — polling-based queue needs no explicit enqueue.
}
