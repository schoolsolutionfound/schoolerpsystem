import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { passwordResetService } from './password-reset.service.js';

export async function loginSyncHandler(request: FastifyRequest, reply: FastifyReply) {
  const currentUser = request.user;

  if (!currentUser) {
    return reply.status(401).send({
      success: false,
      error: { message: 'User non-authenticated', code: 'UNAUTHORIZED' },
    });
  }

  try {
    const data = await authService.loginSync(currentUser);
    return reply.send({
      success: true,
      data,
    });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Internal Server Error', code: err.code || 'SERVER_ERROR' },
    });
  }
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  const currentUser = request.user;

  if (!currentUser) {
    return reply.status(401).send({
      success: false,
      error: { message: 'User non-authenticated', code: 'UNAUTHORIZED' },
    });
  }

  try {
    const data = await authService.logout(currentUser);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Internal Server Error', code: err.code || 'SERVER_ERROR' },
    });
  }
}

export async function forgotPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { email: string };

  if (!body?.email) {
    return reply.status(400).send({
      success: false,
      error: { message: 'Email is required', code: 'VALIDATION_ERROR' },
    });
  }

  try {
    const data = await passwordResetService.forgotPassword(body.email);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to send reset code', code: err.code || 'SERVER_ERROR' },
    });
  }
}

export async function changePasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const currentUser = request.user;
  // currentPassword is optional: required only for voluntary changes
  // (mustChangePassword=false); the forced first-login flow omits it.
  const body = request.body as { newPassword?: string; currentPassword?: string };

  if (!currentUser) {
    return reply.status(401).send({
      success: false,
      error: { message: 'User non-authenticated', code: 'UNAUTHORIZED' },
    });
  }

  if (!body?.newPassword) {
    return reply.status(400).send({
      success: false,
      error: { message: 'newPassword is required', code: 'VALIDATION_ERROR' },
    });
  }

  try {
    const data = await authService.changePassword(currentUser, body.newPassword, body.currentPassword);
    return reply.send({
      success: true,
      data,
    });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Invalid password request', code: err.code || 'INVALID_REQUEST' },
    });
  }
}

export async function resetPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { email?: string; code?: string; newPassword?: string };

  if (!body?.email || !body?.code || !body?.newPassword) {
    return reply.status(400).send({
      success: false,
      error: { message: 'Email, code and newPassword are required', code: 'VALIDATION_ERROR' },
    });
  }

  try {
    const data = await passwordResetService.resetPassword(body.email, body.code, body.newPassword);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: {
        message: err.message || 'Failed to reset password',
        code: err.code || 'INVALID_REQUEST',
        ...(err.attemptsLeft !== undefined ? { attemptsLeft: err.attemptsLeft } : {}),
      },
    });
  }
}
