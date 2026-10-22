import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { processSnsEnvelope, isValidSnsSecret } from '../notifications/email.sns.js';

// ============================================================================
// SES → SNS bounce/complaint webhook
//
// Mounted OUTSIDE the /api/v1 auth plugin because SNS is not a Firebase
// client. Authenticity comes from a shared secret carried in the path:
//
//   POST /api/v1/email/webhook/sns/:secret
//
// Only AWS and the operator ever know the secret, so a caller who cannot
// produce it is rejected before any parsing or DB work happens.
// ============================================================================

export async function emailWebhookRoutes(fastify: FastifyInstance) {
  await fastify.register(async (scope) => {
    // SNS posts application/json; keep the default parser (no raw body needed
    // since we authenticate via the path secret, not a body signature).
    scope.post(
      '/sns/:secret',
      { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { secret } = request.params as { secret: string };
        if (!isValidSnsSecret(secret, process.env.EMAIL_SNS_WEBHOOK_SECRET || '')) {
          return reply.status(403).send({
            success: false,
            error: { message: 'Invalid webhook secret', code: 'INVALID_SECRET' },
          });
        }

        const envelope = request.body as Record<string, any> | null;
        if (!envelope || typeof envelope !== 'object') {
          return reply.status(400).send({
            success: false,
            error: { message: 'Empty webhook body', code: 'EMPTY_BODY' },
          });
        }

        try {
          const result = await processSnsEnvelope(envelope);
          if (!result.ok) {
            return reply.status(400).send({
              success: false,
              error: { message: result.error || 'Malformed SNS message', code: 'INVALID_SNS_MESSAGE' },
            });
          }
          // Always 200 for well-formed traffic so SNS does not retry forever.
          return reply.send({ success: true, data: { suppressed: result.suppressed, ignored: result.ignored } });
        } catch (err: any) {
          request.log.error({ err }, 'email SNS webhook failed');
          return reply.status(500).send({
            success: false,
            error: { message: 'Webhook processing failed', code: 'WEBHOOK_ERROR' },
          });
        }
      }
    );
  });
}
