import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../shared/middleware/auth.js';
import { emailVerificationService } from '../notifications/email.service.js';
import { findUserByUid, findUserByEmail } from '../notifications/email.repository.js';

// ============================================================================
// Email Verification Routes (Phase 2 — OTP)
//
// POST /verify-email/verify     authed — submit the 6-digit code
// POST /verify-email/resend     authed — resend code to the signed-in account
// GET  /verify-email/status     authed — has the signed-in account verified?
//
// There is no public link endpoint: the code is typed into the app by an
// already-signed-in user, so every endpoint is authenticated and the email
// address always comes from the verified session, never from the client.
// ============================================================================

const VerifySchema = z.object({ code: z.string().min(1) });

export async function emailVerificationRoutes(fastify: FastifyInstance) {
  // Authenticated: submit the 6-digit OTP.
  fastify.post('/verify-email/verify', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
    }

    const parsed = VerifySchema.safeParse(request.body || {});
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ success: false, error: { message: 'A verification code is required', code: 'INVALID_REQUEST' } });
    }

    // The address always comes from the authenticated session — a caller can
    // never verify an arbitrary address by naming it in the body.
    const dbUser = await findUserByUid(user.uid);
    const targetEmail = (dbUser?.email || user.email || '').trim().toLowerCase();
    if (!targetEmail) {
      return reply.status(400).send({ success: false, error: { message: 'No email address on file.', code: 'NO_EMAIL' } });
    }

    const result = await emailVerificationService.verifyOtp(targetEmail, parsed.data.code, user.uid);

    if (!result.ok) {
      // LOCKED/EXPIRED are terminal for this code; INVALID is retryable.
      const status = result.code === 'OTP_LOCKED' ? 403 : result.code === 'OTP_EXPIRED' ? 410 : 400;
      return reply.status(status).send({
        success: false,
        error: { message: result.message, code: result.code },
      });
    }

    return reply.send({ success: true, data: { verified: true, email: result.email } });
  });

  // Authenticated: resend to the signed-in account. The address is always
  // derived server-side, so this endpoint cannot be used to mail arbitrary
  // addresses through the institution's SES identity.
  fastify.post('/verify-email/resend', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
    }

    const dbUser = await findUserByUid(user.uid);
    const targetEmail = (dbUser?.email || user.email || '').trim().toLowerCase();
    if (!targetEmail) {
      return reply.status(400).send({ success: false, error: { message: 'No email address on file.', code: 'NO_EMAIL' } });
    }

    // Resolve institution + name for branding; fall back to the session tenant.
    const institutionCode = dbUser?.institutionCode || user.institutionCode || '';
    const institutionName = dbUser?.institutionName || '';

    // If already verified, short-circuit so we don't burn SES quota.
    const owner = await findUserByEmail(institutionCode, targetEmail);
    if (owner?.emailVerified) {
      return reply.send({ success: true, data: { alreadyVerified: true } });
    }

    const result = await emailVerificationService.requestVerification({
      institutionCode,
      email: targetEmail,
      firebaseUid: user.uid,
      institutionName,
    });

    if (!result.ok) {
      // RATE_LIMITED / SUPPRESSED are client-correctable — surface as 4xx.
      const status = result.code === 'RATE_LIMITED' ? 429 : result.code === 'SUPPRESSED' ? 403 : 503;
      return reply.status(status).send({ success: false, error: { message: result.message, code: result.code } });
    }

    return reply.send({ success: true, data: { sent: true, ...(result.devCode ? { devCode: result.devCode } : {}) } });
  });

  // Authenticated: verification state for the signed-in account.
  fastify.get('/verify-email/status', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
    }
    const status = await emailVerificationService.getVerificationStatus(user.uid);
    return reply.send({ success: true, data: status });
  });
}
