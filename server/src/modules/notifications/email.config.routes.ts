import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../shared/middleware/auth.js';
import { getEmailConfig, upsertEmailConfig } from '../notifications/email.repository.js';
import { isSesConfigured } from '../notifications/email.provider.js';

// ============================================================================
// Per-tenant email identity (admin only)
//
// SES credentials are account-level (env/IAM); what varies per school is the
// FROM identity, reply-to and configuration set. One active row per
// institution, keyed by institution_code.
// ============================================================================

const UpsertSchema = z.object({
  fromEmail: z.string().email(),
  fromName: z.string().max(200).optional(),
  replyTo: z.string().email().optional(),
  configurationSet: z.string().max(200).optional(),
  domain: z.string().max(200).optional(),
});

export async function emailConfigRoutes(fastify: FastifyInstance) {
  // Read the calling admin's tenant config.
  fastify.get('/config', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user?.institutionCode) {
      return reply.status(403).send({
        success: false,
        error: { message: 'No institution associated with this account', code: 'NO_INSTITUTION' },
      });
    }
    const config = await getEmailConfig(user.institutionCode);
    return reply.send({
      success: true,
      data: {
        config: config || null,
        sesConfigured: isSesConfigured(),
      },
    });
  });

  // Upsert the calling admin's tenant config.
  fastify.put(
    '/config',
    { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;
      if (!user?.institutionCode) {
        return reply.status(403).send({
          success: false,
          error: { message: 'No institution associated with this account', code: 'NO_INSTITUTION' },
        });
      }

      const parsed = UpsertSchema.safeParse(request.body || {});
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { message: 'Invalid request body', code: 'INVALID_REQUEST' },
        });
      }

      await upsertEmailConfig({
        institutionCode: user.institutionCode,
        fromEmail: parsed.data.fromEmail,
        fromName: parsed.data.fromName,
        replyTo: parsed.data.replyTo,
        configurationSet: parsed.data.configurationSet,
        domain: parsed.data.domain,
      });

      const config = await getEmailConfig(user.institutionCode);
      return reply.send({ success: true, data: { config } });
    }
  );
}
