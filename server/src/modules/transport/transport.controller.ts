import { FastifyRequest, FastifyReply } from 'fastify';
import { transportService } from './transport.service.js';
import { StartTripSchema, UpdateLocationSchema } from './transport.schema.js';

function getInstCode(req: FastifyRequest): string {
  const user = req.user;
  return user?.institutionCode || 'TST001';
}

function getUserId(req: FastifyRequest): string {
  const user = req.user;
  return user?.uid || '';
}

function getRole(req: FastifyRequest): string {
  const user = req.user;
  return (user?.role || '').toLowerCase();
}

function parseZod(err: any) {
  if (err?.name === 'ZodError') {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: err.errors?.[0]?.message || 'Invalid input data',
    };
  }
  return err;
}

function sendError(reply: FastifyReply, err: any, fallbackMsg: string) {
  const parsed = parseZod(err);
  return reply.status(parsed.statusCode || 500).send({
    success: false,
    error: {
      message: parsed.message || fallbackMsg,
      code: parsed.code || 'SERVER_ERROR',
    },
  });
}

export async function getDriverAssignmentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const driverId = getUserId(request);
    const data = await transportService.getDriverAssignment(institutionCode, driverId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch driver assignment');
  }
}

export async function startTripHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsedBody = StartTripSchema.parse(request.body);
    const institutionCode = getInstCode(request);
    const driverId = getUserId(request);
    const data = await transportService.startTrip(institutionCode, driverId, parsedBody.tripType);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to start trip');
  }
}

export async function updateLocationHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tripId = (request.params as any).id;
    const parsedBody = UpdateLocationSchema.parse(request.body);
    const institutionCode = getInstCode(request);
    const driverId = getUserId(request);
    const data = await transportService.updateTripLocation(institutionCode, driverId, tripId, parsedBody);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to update trip location');
  }
}

export async function endTripHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tripId = (request.params as any).id;
    const institutionCode = getInstCode(request);
    const driverId = getUserId(request);
    const data = await transportService.endTrip(institutionCode, driverId, tripId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to end trip');
  }
}

export async function getMyBusHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const userId = getUserId(request);
    const role = getRole(request);
    const data = await transportService.getMyBus(institutionCode, userId, role);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch bus tracking status');
  }
}
