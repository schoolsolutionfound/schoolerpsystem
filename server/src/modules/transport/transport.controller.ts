import { FastifyRequest, FastifyReply } from 'fastify';
import { transportService } from './transport.service.js';
import {
  StartTripSchema,
  UpdateLocationSchema,
  CreateVehicleSchema,
  UpdateVehicleSchema,
  CreateRouteSchema,
  UpdateRouteSchema,
  CreateStopSchema,
  UpdateStopSchema,
  AssignStudentTransportSchema,
} from './transport.schema.js';

function getInstCode(req: FastifyRequest): string {
  const user = req.user;
  if (!user?.institutionCode) {
    throw { statusCode: 403, code: 'TENANT_REQUIRED', message: 'No institution is assigned to this account.' };
  }
  return user.institutionCode;
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

export async function streamBusLocationHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const userId = getUserId(request);
    const role = getRole(request);

    // Initial bus state snapshot
    const initialData = await transportService.getMyBus(institutionCode, userId, role);
    const routeId = initialData?.route?.id;

    // Set Server-Sent Events headers
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.flushHeaders?.();

    // Send initial snapshot immediately
    reply.raw.write(`data: ${JSON.stringify({ type: 'INITIAL', data: initialData })}\n\n`);

    if (!routeId) {
      reply.raw.end();
      return;
    }

    const { routePubSub } = await import('./transport.service.js');
    const unsubscribe = routePubSub.subscribe(routeId, (payload) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch {
        unsubscribe();
      }
    });

    // 20s heartbeat keep-alive to keep NAT / proxy routers from dropping connection
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to establish live location stream');
  }
}

// ---------------------------------------------------------------- admin / admission

export async function getTransportOverviewHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const data = await transportService.getAdminOverview(institutionCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to load transport overview');
  }
}

export async function createRouteHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const body = CreateRouteSchema.parse(request.body);
    const data = await transportService.createRoute(institutionCode, body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to create bus route');
  }
}

export async function updateRouteHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const routeId = (request.params as any).id;
    const body = UpdateRouteSchema.parse(request.body);
    const data = await transportService.updateRoute(institutionCode, routeId, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to update bus route');
  }
}

export async function deleteRouteHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const routeId = (request.params as any).id;
    const data = await transportService.deleteRoute(institutionCode, routeId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to delete bus route');
  }
}

export async function createVehicleHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const body = CreateVehicleSchema.parse(request.body);
    const data = await transportService.createVehicle(institutionCode, body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to create bus');
  }
}

export async function updateVehicleHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const vehicleId = (request.params as any).id;
    const body = UpdateVehicleSchema.parse(request.body);
    const data = await transportService.updateVehicle(institutionCode, vehicleId, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to update bus');
  }
}

export async function addStopHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const routeId = (request.params as any).id;
    const body = CreateStopSchema.parse(request.body);
    const data = await transportService.addStop(institutionCode, routeId, body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to add bus stop');
  }
}

export async function updateStopHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const stopId = (request.params as any).id;
    const body = UpdateStopSchema.parse(request.body);
    const data = await transportService.updateStop(institutionCode, stopId, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to update bus stop');
  }
}

export async function deleteStopHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const stopId = (request.params as any).id;
    const data = await transportService.deleteStop(institutionCode, stopId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to delete bus stop');
  }
}

export async function searchStudentsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const search = String((request.query as any)?.search || '');
    const data = await transportService.searchStudents(institutionCode, search);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to search students');
  }
}

export async function assignStudentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const body = AssignStudentTransportSchema.parse(request.body);
    const data = await transportService.assignStudent(institutionCode, body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to assign student to bus route');
  }
}

export async function removeAssignmentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const institutionCode = getInstCode(request);
    const assignmentId = (request.params as any).id;
    const data = await transportService.removeAssignment(institutionCode, assignmentId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to remove student transport assignment');
  }
}

