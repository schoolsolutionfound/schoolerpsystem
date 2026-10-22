import { timingSafeEqual } from 'crypto';
import { addSuppression, findInstitutionCodeByEmail } from './email.repository.js';

// ============================================================================
// SES → SNS bounce/complaint webhook
//
// SES does not call us directly; it publishes to an SNS topic which POSTs a
// JSON envelope to this endpoint. Two message types arrive:
//
//   SubscriptionConfirmation — sent once when the topic/subscription is
//     created. SNS requires the receiver to GET the SubscribeURL to activate
//     the subscription, otherwise no bounces are ever delivered.
//
//   Notification — carries the SES event in `Message`. We only act on
//     bounce and complaint; delivery notifications are ignored.
//
// The endpoint cannot use Firebase auth (SNS is not a Firebase client), so
// authenticity comes from the shared secret in the URL path, which only AWS
// and the operator know.
// ============================================================================

const SUBSCRIPTION_CONFIRM_TIMEOUT_MS = 5000;

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a || '', 'utf8');
  const bufB = Buffer.from(b || '', 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Validate the path secret against EMAIL_SNS_WEBHOOK_SECRET. */
export function isValidSnsSecret(provided: string, expected: string): boolean {
  if (!expected) return false; // refuse all traffic when unconfigured
  return constantTimeEquals(provided, expected);
}

interface SnsEnvelope {
  Type?: string;
  TopicArn?: string;
  Message?: string;
  SubscribeURL?: string;
  MessageId?: string;
}

interface SesNotification {
  notificationType?: string;
  bounce?: {
    bounceType?: string;
    bouncedRecipients?: { emailAddress?: string; status?: string; diagnosticCode?: string }[];
  };
  complaint?: {
    complainedRecipients?: { emailAddress?: string }[];
  };
}

/** Extract the bounced/complained addresses from an SES notification body. */
export function extractRecipients(message: SesNotification): {
  kind: 'bounce' | 'complaint';
  emails: string[];
} | null {
  if (message.notificationType === 'bounce' && message.bounce) {
    const emails = (message.bounce.bouncedRecipients || [])
      .map((r) => (r.emailAddress || '').trim().toLowerCase())
      .filter(Boolean);
    // A bounce with no recipient list carries nothing actionable.
    return emails.length > 0 ? { kind: 'bounce', emails } : null;
  }
  if (message.notificationType === 'complaint' && message.complaint) {
    const emails = (message.complaint.complainedRecipients || [])
      .map((r) => (r.emailAddress || '').trim().toLowerCase())
      .filter(Boolean);
    return emails.length > 0 ? { kind: 'complaint', emails } : null;
  }
  return null;
}

/** Confirm an SNS subscription by fetching its SubscribeURL (required once). */
async function confirmSubscription(envelope: SnsEnvelope): Promise<void> {
  const url = envelope.SubscribeURL || '';
  // Only ever GET an SNS-owned https URL — never a caller-supplied host.
  if (!/^https:\/\/[a-z0-9.-]+\.amazonaws\.com\//i.test(url)) return;
  try {
    await fetch(url, { method: 'GET', signal: AbortSignal.timeout(SUBSCRIPTION_CONFIRM_TIMEOUT_MS) });
    console.log('[Email Webhook] SNS subscription confirmed');
  } catch (err: any) {
    console.warn('[Email Webhook] SNS subscription confirmation failed:', err.message);
  }
}

export interface ProcessSnsResult {
  ok: boolean;
  suppressed: number;
  ignored: number;
  error?: string;
}

/**
 * Handle one SNS envelope. Idempotent: a repeat bounce for the same address is
 * a no-op because addSuppression uses onConflictDoNothing.
 */
export async function processSnsEnvelope(envelope: SnsEnvelope): Promise<ProcessSnsResult> {
  if (envelope.Type === 'SubscriptionConfirmation') {
    await confirmSubscription(envelope);
    return { ok: true, suppressed: 0, ignored: 0 };
  }

  if (envelope.Type !== 'Notification') {
    return { ok: true, suppressed: 0, ignored: 1 };
  }

  let parsed: SesNotification;
  try {
    parsed = JSON.parse(envelope.Message || '{}');
  } catch {
    return { ok: false, suppressed: 0, ignored: 0, error: 'Malformed SES message' };
  }

  const extracted = extractRecipients(parsed);
  if (!extracted) {
    // Delivery/other notification types carry nothing to suppress.
    return { ok: true, suppressed: 0, ignored: 1 };
  }

  let suppressed = 0;
  for (const email of extracted.emails) {
    const institutionCode = (await findInstitutionCodeByEmail(email)) || '';
    // Suppress even when we cannot resolve a tenant: a null code is still
    // better than re-mailing a hard-bounced address forever.
    await addSuppression({
      institutionCode,
      email,
      reason: extracted.kind,
      sesEventId: envelope.MessageId || '',
      detail: extracted.kind === 'complaint' ? 'recipient marked as spam' : 'hard bounce',
    });
    suppressed++;
  }

  return { ok: true, suppressed, ignored: 0 };
}
