import { announcementRepository, AnnouncementWithTargetsAndReadStatus } from './announcement.repository.js';
import { CreateAnnouncementInput, UpdateAnnouncementInput, AnnouncementQueryInput } from './announcement.schema.js';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, code: string = 'BAD_REQUEST', statusCode: number = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AnnouncementService {
  /**
   * Helper date validation.
   */
  private validateDates(publishAt?: string | null, expiresAt?: string | null) {
    const pubDate = publishAt ? new Date(publishAt) : null;
    const expDate = expiresAt ? new Date(expiresAt) : null;

    if (pubDate && isNaN(pubDate.getTime())) {
      throw new AppError('Invalid publishAt date format', 'INVALID_DATE', 400);
    }
    if (expDate && isNaN(expDate.getTime())) {
      throw new AppError('Invalid expiresAt date format', 'INVALID_DATE', 400);
    }

    if (pubDate && expDate && expDate <= pubDate) {
      throw new AppError('Expiration date must be after publication date', 'INVALID_EXPIRATION_DATE', 400);
    }
  }

  /**
   * Create announcement with action-based status resolution.
   */
  async createAnnouncement(
    institutionCode: string,
    createdBy: string,
    input: CreateAnnouncementInput
  ): Promise<AnnouncementWithTargetsAndReadStatus> {
    if (!institutionCode) {
      throw new AppError('Institution code is required', 'MISSING_INSTITUTION_CODE', 400);
    }

    this.validateDates(input.publishAt, input.expiresAt);

    let status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' = 'DRAFT';
    let publishAt = input.publishAt ? new Date(input.publishAt) : new Date();

    if (input.action === 'schedule') {
      if (!input.publishAt) {
        throw new AppError('Publish date is required when scheduling an announcement', 'MISSING_PUBLISH_DATE', 400);
      }
      if (publishAt <= new Date()) {
        throw new AppError('Scheduled publication date must be in the future', 'INVALID_SCHEDULE_DATE', 400);
      }
      status = 'SCHEDULED';
    } else if (input.action === 'publish') {
      status = 'PUBLISHED';
      publishAt = input.publishAt ? new Date(input.publishAt) : new Date();
    } else {
      status = 'DRAFT';
    }

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

    return await announcementRepository.create(
      institutionCode,
      {
        title: input.title,
        content: input.content,
        type: input.type || 'GENERAL',
        priority: input.priority || 'NORMAL',
        status,
        createdBy,
        publishAt,
        expiresAt,
        imageUrl: input.imageUrl || '',
        attachmentUrl: input.attachmentUrl || '',
      },
      input.targets || [{ targetType: 'all', targetRole: '' }]
    );
  }

  /**
   * Update announcement with lifecycle guard checks.
   */
  async updateAnnouncement(
    institutionCode: string,
    id: string,
    input: UpdateAnnouncementInput
  ): Promise<AnnouncementWithTargetsAndReadStatus> {
    const existing = await announcementRepository.findById(institutionCode, id);
    if (!existing) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    if (existing.status === 'EXPIRED' || existing.status === 'CANCELLED') {
      throw new AppError(
        `Cannot edit announcement in ${existing.status} status`,
        'CANNOT_EDIT_FINALIZED_ANNOUNCEMENT',
        400
      );
    }

    this.validateDates(
      input.publishAt !== undefined ? input.publishAt : existing.publishAt?.toISOString(),
      input.expiresAt !== undefined ? input.expiresAt : existing.expiresAt?.toISOString()
    );

    let newStatus = existing.status as 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'CANCELLED';
    let publishAt = existing.publishAt;

    if (input.action === 'schedule') {
      const pDateStr = input.publishAt || existing.publishAt?.toISOString();
      if (!pDateStr) {
        throw new AppError('Publish date is required when scheduling an announcement', 'MISSING_PUBLISH_DATE', 400);
      }
      const pDate = new Date(pDateStr);
      if (pDate <= new Date()) {
        throw new AppError('Scheduled publication date must be in the future', 'INVALID_SCHEDULE_DATE', 400);
      }
      newStatus = 'SCHEDULED';
      publishAt = pDate;
    } else if (input.action === 'publish') {
      newStatus = 'PUBLISHED';
      publishAt = input.publishAt ? new Date(input.publishAt) : new Date();
    } else if (input.action === 'draft') {
      newStatus = 'DRAFT';
    }

    const expiresAt = input.expiresAt !== undefined ? (input.expiresAt ? new Date(input.expiresAt) : null) : existing.expiresAt;

    const updated = await announcementRepository.update(
      institutionCode,
      id,
      {
        ...(input.title ? { title: input.title } : {}),
        ...(input.content ? { content: input.content } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        status: newStatus,
        publishAt,
        expiresAt,
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.attachmentUrl !== undefined ? { attachmentUrl: input.attachmentUrl } : {}),
      },
      input.targets
    );

    if (!updated) {
      throw new AppError('Failed to update announcement', 'UPDATE_FAILED', 500);
    }

    return updated;
  }

  /**
   * Delete announcement (only DRAFT allowed).
   */
  async deleteAnnouncement(institutionCode: string, id: string): Promise<boolean> {
    const existing = await announcementRepository.findById(institutionCode, id);
    if (!existing) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError(
        `Only DRAFT announcements can be deleted. Current status: ${existing.status}`,
        'ONLY_DRAFT_CAN_BE_DELETED',
        400
      );
    }

    return await announcementRepository.delete(institutionCode, id);
  }

  /**
   * Publish announcement immediately (DRAFT or SCHEDULED -> PUBLISHED).
   */
  async publishAnnouncement(institutionCode: string, id: string): Promise<AnnouncementWithTargetsAndReadStatus> {
    const existing = await announcementRepository.findById(institutionCode, id);
    if (!existing) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    if (existing.status === 'CANCELLED' || existing.status === 'EXPIRED') {
      throw new AppError(
        `Cannot publish announcement in ${existing.status} state`,
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    const updated = await announcementRepository.update(institutionCode, id, {
      status: 'PUBLISHED',
      publishAt: new Date(),
    });

    if (!updated) {
      throw new AppError('Failed to publish announcement', 'PUBLISH_FAILED', 500);
    }

    return updated;
  }

  /**
   * Cancel announcement (SCHEDULED or PUBLISHED -> CANCELLED).
   */
  async cancelAnnouncement(institutionCode: string, id: string): Promise<AnnouncementWithTargetsAndReadStatus> {
    const existing = await announcementRepository.findById(institutionCode, id);
    if (!existing) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    if (existing.status === 'CANCELLED') {
      throw new AppError('Announcement is already cancelled', 'ALREADY_CANCELLED', 400);
    }

    if (existing.status === 'EXPIRED') {
      throw new AppError('Cannot cancel an expired announcement', 'CANNOT_CANCEL_EXPIRED', 400);
    }

    const updated = await announcementRepository.update(institutionCode, id, {
      status: 'CANCELLED',
    });

    if (!updated) {
      throw new AppError('Failed to cancel announcement', 'CANCEL_FAILED', 500);
    }

    return updated;
  }

  /**
   * Archive announcement handler.
   */
  async archiveAnnouncement(institutionCode: string, id: string): Promise<AnnouncementWithTargetsAndReadStatus> {
    const existing = await announcementRepository.findById(institutionCode, id);
    if (!existing) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    if (existing.status === 'CANCELLED' || existing.status === 'EXPIRED') {
      return existing;
    }

    const updated = await announcementRepository.update(institutionCode, id, {
      status: 'EXPIRED',
    });

    if (!updated) {
      throw new AppError('Failed to archive announcement', 'ARCHIVE_FAILED', 500);
    }

    return updated;
  }

  /**
   * Get single announcement by ID with institution check.
   */
  async getAnnouncement(
    institutionCode: string,
    id: string,
    userId?: string
  ): Promise<AnnouncementWithTargetsAndReadStatus> {
    const item = await announcementRepository.findById(institutionCode, id, userId);
    if (!item) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }
    return item;
  }

  /**
   * List announcements for management users (Staff / Admin).
   */
  async listAnnouncements(
    institutionCode: string,
    query: AnnouncementQueryInput,
    pagination: { limit: number; offset: number }
  ): Promise<{ items: AnnouncementWithTargetsAndReadStatus[]; total: number }> {
    return await announcementRepository.list(institutionCode, query, pagination);
  }

  /**
   * List user feed for active announcements.
   */
  async listUserFeed(
    institutionCode: string,
    userRole: string,
    userClassSectionIds: string[],
    userId: string,
    pagination: { limit: number; offset: number }
  ): Promise<{ items: AnnouncementWithTargetsAndReadStatus[]; total: number }> {
    return await announcementRepository.listUserFeed(
      institutionCode,
      userRole,
      userClassSectionIds,
      userId,
      pagination
    );
  }

  /**
   * Mark announcement as read.
   */
  async markRead(institutionCode: string, id: string, userId: string): Promise<boolean> {
    const item = await announcementRepository.findById(institutionCode, id);
    if (!item) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }
    return await announcementRepository.markRead(institutionCode, id, userId);
  }

  /**
   * Get unread count.
   */
  async getUnreadCount(
    institutionCode: string,
    userRole: string,
    userClassSectionIds: string[],
    userId: string
  ): Promise<number> {
    return await announcementRepository.getUnreadCount(institutionCode, userRole, userClassSectionIds, userId);
  }
}

export const announcementService = new AnnouncementService();
