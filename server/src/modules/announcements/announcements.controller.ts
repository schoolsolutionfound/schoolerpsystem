import { FastifyRequest, FastifyReply } from 'fastify';
import { announcementsService } from './announcements.service.js';

export async function listAnnouncementsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    const instCode = user?.institutionCode;
    if (!instCode) {
      return reply.status(403).send({
        success: false,
        error: { message: 'TENANT_REQUIRED: No institution assigned to current user account.' },
      });
    }

    const { department } = (request.query as any) || {};
    const effectiveDept = department || user?.department;
    const announcements = await announcementsService.listAnnouncements(
      instCode,
      user?.role,
      effectiveDept
    );

    return reply.send({ success: true, data: announcements });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to list announcements' },
    });
  }
}

export async function createAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    const instCode = user?.institutionCode;
    if (!instCode) {
      return reply.status(403).send({
        success: false,
        error: { message: 'TENANT_REQUIRED: No institution assigned to current user account.' },
      });
    }

    const body = request.body as any;
    if (!body?.title?.trim() || !body?.content?.trim()) {
      return reply.status(400).send({
        success: false,
        error: { message: 'Title and content are required' },
      });
    }

    const created = await announcementsService.createAnnouncement(instCode, {
      title: body.title.trim(),
      content: body.content.trim(),
      targetAudience: body.targetAudience,
      department: body.department,
      priority: body.priority,
      authorId: user.uid,
      authorName: user.name || body.author || 'School Administration',
      authorRole: user.role,
    });

    return reply.status(201).send({ success: true, data: created });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to create announcement' },
    });
  }
}

export async function deleteAnnouncementHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    const instCode = user?.institutionCode;
    if (!instCode) {
      return reply.status(403).send({
        success: false,
        error: { message: 'TENANT_REQUIRED: No institution assigned to current user account.' },
      });
    }

    const { id } = request.params as { id: string };
    const success = await announcementsService.deleteAnnouncement(
      instCode,
      id,
      user.uid,
      user.role
    );

    if (!success) {
      return reply.status(404).send({
        success: false,
        error: { message: 'Announcement not found or access denied' },
      });
    }

    return reply.send({ success: true, message: 'Announcement deleted' });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to delete announcement' },
    });
  }
}
