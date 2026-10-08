import {
  ExpoPushMessage,
  ExpoPushTicket,
  NotificationRecord,
  PushTokenRecord,
} from './notification.types.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;
const EXPO_MAX_RETRIES = 3;
const EXPO_RETRY_BASE_DELAY = 1000;

/**
 * Send push notifications via Expo Push API.
 * Supports batching (up to 100 per request) and automatic retry.
 */
export async function sendExpoPushes(
  messages: ExpoPushMessage[]
): Promise<{ tickets: ExpoPushTicket[]; failed: number }> {
  if (messages.length === 0) {
    return { tickets: [], failed: 0 };
  }

  const allTickets: ExpoPushTicket[] = [];
  let failedCount = 0;

  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    const batch = messages.slice(i, i + EXPO_BATCH_SIZE);
    const { tickets, failed } = await sendBatchWithRetry(batch);
    allTickets.push(...tickets);
    failedCount += failed;
  }

  return { tickets: allTickets, failed: failedCount };
}

async function sendBatchWithRetry(
  messages: ExpoPushMessage[]
): Promise<{ tickets: ExpoPushTicket[]; failed: number }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= EXPO_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Expo push API returned ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { data: ExpoPushTicket[] };
      const tickets = data.data || [];

      const failed = tickets.filter((t) => t.status === 'error').length;
      return { tickets, failed };
    } catch (error: any) {
      lastError = error;
      if (attempt < EXPO_MAX_RETRIES) {
        const delay = EXPO_RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  console.error('[Expo Push] All retries exhausted:', lastError?.message);
  return {
    tickets: messages.map(() => ({ status: 'error' as const, message: lastError?.message || 'Unknown error' })),
    failed: messages.length,
  };
}

/**
 * Build Expo push messages from notification records + their device tokens.
 */
export function buildPushMessages(
  notifications: NotificationRecord[],
  tokenMap: Map<string, PushTokenRecord[]>
): ExpoPushMessage[] {
  const messages: ExpoPushMessage[] = [];

  for (const notification of notifications) {
    const tokens = tokenMap.get(notification.recipientId);
    if (!tokens || tokens.length === 0) continue;

    for (const pushToken of tokens) {
      if (!pushToken.isActive) continue;

      messages.push({
        to: pushToken.token,
        title: notification.title,
        body: notification.body,
        data: {
          notificationId: notification.id,
          type: notification.type,
          institutionCode: notification.institutionCode,
          ...notification.data,
        },
        sound: 'default',
        priority: notification.priority === 'urgent' ? 'high' : 'default',
        ttl: notification.priority === 'urgent' ? 3600 : 86400,
      });
    }
  }

  return messages;
}

/**
 * Process tickets and map back to notification IDs.
 * Returns notification IDs that should be marked sent vs failed.
 */
export function processTickets(
  notifications: NotificationRecord[],
  tokenMap: Map<string, PushTokenRecord[]>,
  tickets: ExpoPushTicket[]
): { sentIds: string[]; failedIds: string[]; deactivateTokens: string[] } {
  const sentIds: string[] = [];
  const failedIds: string[] = [];
  const deactivateTokens: string[] = [];

  let ticketIndex = 0;

  for (const notification of notifications) {
    const tokens = tokenMap.get(notification.recipientId);
    if (!tokens || tokens.length === 0) {
      // No tokens — mark as sent (in-app only, nothing to push)
      sentIds.push(notification.id);
      continue;
    }

    let hasSuccess = false;
    let hasInvalidToken = false;

    for (const pushToken of tokens) {
      if (!pushToken.isActive) continue;

      const ticket = tickets[ticketIndex++];
      if (!ticket) continue;

      if (ticket.status === 'ok') {
        hasSuccess = true;
      } else {
        const code = ticket.details?.error;
        if (code === 'DeviceNotRegistered') {
          deactivateTokens.push(pushToken.token);
          hasInvalidToken = true;
        }
      }
    }

    if (hasSuccess) {
      sentIds.push(notification.id);
    } else if (hasInvalidToken || ticketIndex > 0) {
      // All tokens failed or were invalid
      if (hasInvalidToken && !hasSuccess) {
        // All tokens deactivated — mark as sent (no more pushes possible)
        sentIds.push(notification.id);
      } else {
        failedIds.push(notification.id);
      }
    } else {
      // No valid tokens to send to
      sentIds.push(notification.id);
    }
  }

  return { sentIds, failedIds, deactivateTokens };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
