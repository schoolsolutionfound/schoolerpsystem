import { FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from './notification.service.js';

function extractInstCode(req: FastifyRequest): string {
  const instCode = req.user?.institutionCode?.trim();
  if (!instCode) {
    throw { statusCode: 403, code: 'NO_INSTITUTION', message: 'No institution assigned to this user.' };
  }
  return instCode;
}

function extractUserId(req: FastifyRequest): string {
  const uid = req.user?.uid;
  if (!uid) {
    throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required.' };
  }
  return uid;
}

function errorResponse(reply: FastifyReply, err: any) {
  return reply.status(err.statusCode || 500).send({
    success: false,
    error: { message: err.message || 'Internal server error', code: err.code || 'INTERNAL_ERROR' },
  });
}

// ============================================================================
// User endpoints
// ============================================================================

export async function getMyNotificationsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = extractUserId(req);
    const q = (req.query as any) || {};
    const data = await notificationService.getMyNotifications(userId, {
      limit: Number(q.limit) || 50,
      offset: Number(q.offset) || 0,
      unreadOnly: q.unreadOnly === 'true',
      type: q.type,
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function getUnreadCountHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = extractUserId(req);
    const unread = await notificationService.getMyUnreadCount(userId);
    return reply.send({ success: true, data: { unread } });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function markAsReadHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = extractUserId(req);
    const { id } = req.params as { id: string };
    await notificationService.markAsRead(id, userId);
    return reply.send({ success: true, data: { marked: true } });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function markAllAsReadHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = extractUserId(req);
    const count = await notificationService.markAllAsRead(userId);
    return reply.send({ success: true, data: { marked: count } });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

// ============================================================================
// Token management
// ============================================================================

export async function registerTokenHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = extractUserId(req);
    const instCode = extractInstCode(req);
    const body = req.body as any;
    if (!body?.token || !body?.platform) {
      return reply.status(400).send({
        success: false,
        error: { message: 'token and platform are required', code: 'VALIDATION_ERROR' },
      });
    }
    const data = await notificationService.registerToken(userId, instCode, {
      token: body.token,
      platform: body.platform,
      deviceName: body.deviceName || '',
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function unregisterTokenHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = req.body as any;
    if (!body?.token) {
      return reply.status(400).send({
        success: false,
        error: { message: 'token is required', code: 'VALIDATION_ERROR' },
      });
    }
    await notificationService.unregisterToken(body.token, extractUserId(req));
    return reply.send({ success: true, data: { unregistered: true } });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

// ============================================================================
// Preferences
// ============================================================================

export async function getPreferencesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = extractUserId(req);
    const data = await notificationService.getPreferences(userId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function updatePreferencesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = extractUserId(req);
    const instCode = extractInstCode(req);
    const body = (req.body || {}) as { pushEnabled?: boolean; disabledTypes?: string[] };
    if (body.disabledTypes !== undefined && !Array.isArray(body.disabledTypes)) {
      return reply.status(400).send({
        success: false,
        error: { message: 'disabledTypes must be an array', code: 'VALIDATION_ERROR' },
      });
    }
    const data = await notificationService.updatePreferences(userId, instCode, {
      pushEnabled: body.pushEnabled,
      disabledTypes: body.disabledTypes,
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

// ============================================================================
// Send endpoints (staff/admin)
// ============================================================================

export async function sendToUserHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(req);
    const body = req.body as any;
    if (!body?.userId || !body?.title || !body?.body) {
      return reply.status(400).send({
        success: false,
        error: { message: 'userId, title, body are required', code: 'VALIDATION_ERROR' },
      });
    }
    const id = await notificationService.sendToUser({
      institutionCode: instCode,
      recipientId: body.userId,
      title: body.title,
      body: body.body,
      type: body.type,
      priority: body.priority,
      data: body.data,
    });
    return reply.send({ success: true, data: { id } });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function sendBatchHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(req);
    const body = req.body as any;
    if (!body?.recipientIds || !Array.isArray(body.recipientIds) || body.recipientIds.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { message: 'recipientIds array is required', code: 'VALIDATION_ERROR' },
      });
    }
    if (!body?.title || !body?.body) {
      return reply.status(400).send({
        success: false,
        error: { message: 'title and body are required', code: 'VALIDATION_ERROR' },
      });
    }
    const data = await notificationService.sendToUsers({
      institutionCode: instCode,
      recipientIds: body.recipientIds,
      title: body.title,
      body: body.body,
      type: body.type,
      priority: body.priority,
      channel: body.channel,
      data: body.data,
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

// ============================================================================
// Campaign endpoints (admin)
// ============================================================================

export async function createCampaignHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(req);
    const userId = extractUserId(req);
    const body = req.body as any;
    if (!body?.title || !body?.body || !body?.target) {
      return reply.status(400).send({
        success: false,
        error: { message: 'title, body, target are required', code: 'VALIDATION_ERROR' },
      });
    }
    const id = await notificationService.createCampaign({
      institutionCode: instCode,
      title: body.title,
      body: body.body,
      type: body.type,
      priority: body.priority,
      channel: body.channel,
      target: body.target,
      scheduledAt: body.scheduledAt,
      createdBy: userId,
    });
    return reply.send({ success: true, data: { id } });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function launchCampaignHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(req);
    const { id } = req.params as { id: string };
    const data = await notificationService.launchCampaign(id, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function getCampaignsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(req);
    const q = (req.query as any) || {};
    const data = await notificationService.getCampaigns(instCode, {
      limit: Number(q.limit) || 50,
      offset: Number(q.offset) || 0,
      status: q.status,
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function getCampaignStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(req);
    const data = await notificationService.getCampaignStats(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

// ============================================================================
// Stats (admin)
// ============================================================================

export async function getStatsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(req);
    const data = await notificationService.getStats(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

// ============================================================================
// Templates (admin)
// ============================================================================

export async function getTemplatesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(req);
    const q = (req.query as any) || {};
    const data = await notificationService.getTemplates(instCode, q.type);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}

export async function upsertTemplateHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(req);
    const body = req.body as any;
    if (!body?.type || !body?.titleTemplate || !body?.bodyTemplate) {
      return reply.status(400).send({
        success: false,
        error: { message: 'type, titleTemplate, bodyTemplate are required', code: 'VALIDATION_ERROR' },
      });
    }
    const data = await notificationService.upsertTemplate({
      institutionCode: instCode,
      type: body.type,
      channel: body.channel || 'push',
      titleTemplate: body.titleTemplate,
      bodyTemplate: body.bodyTemplate,
      locale: body.locale || 'en',
      isActive: body.isActive ?? true,
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    return errorResponse(reply, err);
  }
}
