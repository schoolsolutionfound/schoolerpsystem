import { SESv2Client, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-sesv2';

// ============================================================================
// SES Email Provider (Phase 2)
//
// Sends via AWS SES v2. Credentials come from env (IAM is account-level, not
// per-tenant); what IS per-tenant is the FROM identity + configuration set,
// resolved by the caller from institution_email_config.
//
// Delivery failures are classified so the queue can distinguish transient
// (retry) from configuration (retry, alert) from recipient-permanent (suppress):
//   - transient: throttling, 5xx, network — retry with backoff
//   - config: IAM/identity/sandbox/message problems — retry, never suppress
//   - permanent: the recipient itself is on the account suppression list
//
// Important: a send-time rejection is almost never about the recipient. The
// "not verified" rejection in the SES sandbox and an IAM AccessDenied both
// arrive as MessageRejected/AccessDeniedException; classifying those as
// permanent poisons deliverable addresses. Bounces are learned from SNS
// delivery events, not from the send call.
// ============================================================================

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  configurationSet?: string;
}

export type EmailFailureKind = 'transient' | 'permanent' | 'config';

export class EmailSendError extends Error {
  constructor(
    message: string,
    public readonly kind: EmailFailureKind,
    public readonly code: string
  ) {
    super(message);
    this.name = 'EmailSendError';
  }
}

let client: SESv2Client | null = null;

export function isSesConfigured(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && (process.env.AWS_REGION || process.env.SES_REGION));
}

function getClient(): SESv2Client {
  if (!client) {
    const region = process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1';
    client = new SESv2Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
      },
      // Bound the socket so a hung SES call can't stall the queue worker.
      requestHandler: { requestTimeout: 15000, connectionTimeout: 5000 } as any,
      maxAttempts: 3,
    });
  }
  return client;
}

/** Test seam: reset the memoised client (used by unit tests). */
export function __resetSesClient(): void {
  client = null;
}

function classifyAwsError(err: any): EmailFailureKind {
  const name = err?.name || '';
  const status = err?.$metadata?.httpStatusCode || 0;
  // Throttling / transient service issues → retry.
  if (
    name === 'TooManyRequestsException' ||
    name === 'ThrottlingException' ||
    name === 'LimitExceededException' ||
    name === 'ServiceUnavailableException' ||
    name === 'InternalFailure' ||
    status === 429 ||
    status >= 500
  ) {
    return 'transient';
  }

  // The only send-time rejection that is genuinely about the recipient: SES
  // itself has the address on its account-level suppression list.
  if (name === 'SuppressedDestinationException') {
    return 'permanent';
  }

  // AccessDeniedException, UnrecognizedClientException, InvalidClientTokenId,
  // SignatureDoesNotMatch, MessageRejected (sandbox "not verified", invalid
  // message), ConfigurationSetDoesNotExistException, MailFromDomainNotVerified,
  // AccountSuspended/SendingPaused and friends are sender/config problems.
  // They say nothing about the recipient, so never suppress on them.
  return 'config';
}

export async function sendEmail(message: EmailMessage): Promise<{ messageId: string }> {
  if (!isSesConfigured()) {
    throw new EmailSendError('SES not configured — set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / SES_REGION', 'config', 'SES_NOT_CONFIGURED');
  }

  const from =
    message.fromName && message.fromName.trim()
      ? `${message.fromName.trim()} <${message.fromEmail}>`
      : message.fromEmail;

  // Every send must carry a configuration set so bounce/complaint events reach
  // the SNS webhook even when a tenant has not configured one.
  const configurationSet = message.configurationSet || process.env.SES_CONFIGURATION_SET || '';

  const input: SendEmailCommandInput = {
    FromEmailAddress: from,
    Destination: { ToAddresses: [message.to] },
    Content: {
      Simple: {
        Subject: { Data: message.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: message.html, Charset: 'UTF-8' },
          ...(message.text ? { Text: { Data: message.text, Charset: 'UTF-8' } } : {}),
        },
      },
    },
    ...(message.replyTo ? { ReplyToAddresses: [message.replyTo] } : {}),
    ...(configurationSet ? { ConfigurationSetName: configurationSet } : {}),
  };

  try {
    const result = await getClient().send(new SendEmailCommand(input));
    return { messageId: result.MessageId || '' };
  } catch (err: any) {
    const kind = classifyAwsError(err);
    throw new EmailSendError(err?.message || 'SES send failed', kind, err?.name || 'SESError');
  }
}
