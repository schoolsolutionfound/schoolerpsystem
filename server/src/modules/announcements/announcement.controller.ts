import { FastifyRequest, FastifyReply } from 'fastify';
import { announcementService } from './announcement.service.js';
import {
  CreateAnnouncementSchema,
  UpdateAnnouncementSchema,
  AnnouncementQuerySchema,
} from './announcement.schema.js';

function getInstCode(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.institutionCode || '';
}

function getUserId(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.uid || user?.id || '';
}

function getUserRole(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.role || 'student';
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
  return reply.status(parsed.statusCode || err.statusCode || 500).send({
    success: false,
    error: {
      message: parsed.message || err.message || fallbackMsg,
      code: parsed.code || err.code || 'INTERNAL_ERROR',
    },
  });
}

/**
  GET /api/v1/announcements
  Management list for Staff / Admin users.
 */
export async function listAnnouncementsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = AnnouncementQuerySchema.parse(request.query || {});
    const limit = query.limit || 100;
    const offset = query.offset || 0;
    const data = await announcementService.listAnnouncements(getInstCode(request), query, { limit, offset });
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to list announcements');
  }
}

/**
  GET /api/v1/announcements/feed
  User-facing active announcement feed.
 */
export async function listUserFeedHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = AnnouncementQuerySchema.parse(request.query || {});
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const instCode = getInstCode(request);
    const userId = getUserId(request);
    const role = getUserRole(request);

    // If user context contains enrolled class/section, extract them
    const userObj = (request as any).user || {};
    const classSections: string[] = userObj.classSectionIds || [];

    const data = await announcementService.listUserFeed(instCode, role, classSections, userId, { limit, offset });
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch announcement feed');
  }
}

/**
  GET /api/v1/announcements/unread-count
  Get count of unread announcements for current user.
 */
export async function getUnreadCountHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = getInstCode(request);
    const userId = getUserId(request);
    const role = getUserRole(request);
    const userObj = (request as any).user || {};
    const classSections: string[] = userObj.classSectionIds || [];

    const unreadCount = await announcementService.getUnreadCount(instCode, role, classSections, userId);
    return reply.send({ success: true, data: { unreadCount } });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch unread announcement count');
  }
}

/**
  GET /api/v1/announcements/:id
  Get single announcement details.
 */
export async function getAnnouncementByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await announcementService.getAnnouncement(getInstCode(request), request.params.id, getUserId(request));
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch announcement details');
  }
}

/**
  POST /api/v1/announcements
  Create a new announcement.
 */
export async function createAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateAnnouncementSchema.parse(request.body);
    const instCode = getInstCode(request);
    const userId = getUserId(request);

    const data = await announcementService.createAnnouncement(instCode, userId, body);
    return reply.status(201).send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to create announcement');
  }
}

/**
  PATCH /api/v1/announcements/:id
  Update an existing announcement.
 */
export async function updateAnnouncementHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const body = UpdateAnnouncementSchema.parse(request.body);
    const instCode = getInstCode(request);

    const data = await announcementService.updateAnnouncement(instCode, request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to update announcement');
  }
}

/**
  DELETE /api/v1/announcements/:id
  Delete a draft announcement.
 */
export async function deleteAnnouncementHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await announcementService.deleteAnnouncement(getInstCode(request), request.params.id);
    return reply.send({ success: true, data: { message: 'Announcement deleted successfully' } });
  } catch (err) {
    return sendError(reply, err, 'Failed to delete announcement');
  }
}

/**
  POST /api/v1/announcements/:id/publish
  Publish a draft or scheduled announcement immediately.
 */
export async function publishAnnouncementHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await announcementService.publishAnnouncement(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to publish announcement');
  }
}

/**
  POST /api/v1/announcements/:id/cancel
  Cancel a scheduled or published announcement.
 */
export async function cancelAnnouncementHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await announcementService.cancelAnnouncement(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to cancel announcement');
  }
}

/**
  POST /api/v1/announcements/:id/archive
  Archive an announcement.
 */
export async function archiveAnnouncementHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await announcementService.archiveAnnouncement(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to archive announcement');
  }
}

/**
  POST /api/v1/announcements/:id/read
  Mark announcement as read.
 */
export async function markAnnouncementReadHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const instCode = getInstCode(request);
    const userId = getUserId(request);
    await announcementService.markRead(instCode, request.params.id, userId);
    return reply.send({ success: true, data: { read: true } });
  } catch (err) {
    return sendError(reply, err, 'Failed to mark announcement as read');
  }
}
