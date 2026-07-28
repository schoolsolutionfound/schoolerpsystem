import { FastifyRequest, FastifyReply } from 'fastify';
import { userService, CompleteProfileInput } from './user.service.js';

export async function getProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const currentUser = request.user;

  if (!currentUser) {
    return reply.status(401).send({
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    });
  }

  try {
    const data = await userService.getProfile(currentUser);
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

export async function completeProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const currentUser = request.user;
  const body = request.body as CompleteProfileInput;

  if (!currentUser) {
    return reply.status(401).send({
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    });
  }

  try {
    const data = await userService.completeProfile(currentUser, body);
    return reply.send({
      success: true,
      data,
    });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Invalid profile data', code: err.code || 'INVALID_REQUEST' },
    });
  }
}
