import { announcementRepository, AnnouncementWithTargetsAndReadStatus } from './announcement.repository.js';
import {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementQueryInput,
  TargetInput,
} from './announcement.schema.js';
import {
  dbFindUserByIdOrUid,
  dbFindStudentClassSectionId,
} from '../shared/db/index.js';
import { resolveParentChildren } from '../users/parent-links.js';

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

export interface AnnouncementActor {
  userId: string;
  role: string;
}

export function normalizeAnnouncementRole(role: string | undefined): string {
  const normalized = (role || '').toLowerCase().trim();
  return normalized === 'institution admin' ? 'admin' : normalized;
}

const MANAGER_ROLES = new Set(['admin', 'hod', 'principal']);

export function isAnnouncementManager(role: string | undefined): boolean {
  return MANAGER_ROLES.has(normalizeAnnouncementRole(role));
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
   * Managers (admin/hod/principal) may manage any announcement in the institution.
   * Everyone else may only manage announcements they created themselves.
   */
  private assertCanManage(actor: AnnouncementActor, existing: AnnouncementWithTargetsAndReadStatus): void {
    if (isAnnouncementManager(actor.role)) return;
    if (existing.createdBy && existing.createdBy === actor.userId) return;
    throw new AppError(
      'You can only modify announcements you created',
      'NOT_ANNOUNCEMENT_OWNER',
      403
    );
  }

  /**
   * Non-manager creators may only target specific classes/sections, and only
   * classes they are assigned to (class-teacher or subject-teacher assignments).
   */
  private async assertTargetsAllowed(
    institutionCode: string,
    actor: AnnouncementActor,
    targets: TargetInput[] | undefined
  ): Promise<void> {
    if (isAnnouncementManager(actor.role)) return;

    const effective: TargetInput[] = targets && targets.length > 0 ? targets : [];

    if (effective.length === 0) {
      throw new AppError(
        'Your role can only target specific classes or sections',
        'TARGET_NOT_ALLOWED',
        403
      );
    }

    for (const t of effective) {
      const classRef = (t.classId || t.sectionId || '').trim();
      if ((t.targetType !== 'class' && t.targetType !== 'section') || !classRef) {
        throw new AppError(
          'Your role can only target specific classes or sections',
          'TARGET_NOT_ALLOWED',
          403
        );
      }
    }

    const user = await dbFindUserByIdOrUid(actor.userId);
    if (!user || (user.institutionCode && user.institutionCode !== institutionCode)) {
      throw new AppError('User not found in institution', 'NOT_FOUND', 404);
    }

    const ownedClassIds = await announcementRepository.findTeacherClassIds(institutionCode, user.id);
    const requested = effective.map((t) => (t.classId || t.sectionId || '').trim());
    if (requested.some((ref) => !ownedClassIds.includes(ref))) {
      throw new AppError(
        'You can only target classes you are assigned to',
        'TARGET_NOT_OWNED',
        403
      );
    }
  }

  /**
   * Create announcement with action-based status resolution.
   */
  async createAnnouncement(
    institutionCode: string,
    actor: AnnouncementActor,
    input: CreateAnnouncementInput
  ): Promise<AnnouncementWithTargetsAndReadStatus> {
    if (!institutionCode) {
      throw new AppError('Institution code is required', 'MISSING_INSTITUTION_CODE', 400);
    }

    await this.assertTargetsAllowed(institutionCode, actor, input.targets);

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
        createdBy: actor.userId,
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
    input: UpdateAnnouncementInput,
    actor: AnnouncementActor
  ): Promise<AnnouncementWithTargetsAndReadStatus> {
    const existing = await announcementRepository.findById(institutionCode, id);
    if (!existing) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    this.assertCanManage(actor, existing);

    if (input.targets !== undefined) {
      await this.assertTargetsAllowed(institutionCode, actor, input.targets);
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
  async deleteAnnouncement(institutionCode: string, id: string, actor: AnnouncementActor): Promise<boolean> {
    const existing = await announcementRepository.findById(institutionCode, id);
    if (!existing) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    this.assertCanManage(actor, existing);

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
  async publishAnnouncement(
    institutionCode: string,
    id: string,
    actor: AnnouncementActor
  ): Promise<AnnouncementWithTargetsAndReadStatus> {
    const existing = await announcementRepository.findById(institutionCode, id);
    if (!existing) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    this.assertCanManage(actor, existing);

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
  async cancelAnnouncement(
    institutionCode: string,
    id: string,
    actor: AnnouncementActor
  ): Promise<AnnouncementWithTargetsAndReadStatus> {
    const existing = await announcementRepository.findById(institutionCode, id);
    if (!existing) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    this.assertCanManage(actor, existing);

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
   * Get single announcement by ID with institution check.
   * Non-published announcements are only visible to managers and their creator.
   */
  async getAnnouncement(
    institutionCode: string,
    id: string,
    userId?: string,
    role?: string
  ): Promise<AnnouncementWithTargetsAndReadStatus> {
    const item = await announcementRepository.findById(institutionCode, id, userId);
    if (!item) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    const isOwn = !!userId && item.createdBy === userId;
    if (item.status !== 'PUBLISHED' && !isAnnouncementManager(role) && !isOwn) {
      throw new AppError('Announcement not found', 'NOT_FOUND', 404);
    }

    return item;
  }

  /**
   * List announcements for management users.
   * Managers see the whole institution; other staff only see their own.
   */
  async listAnnouncements(
    institutionCode: string,
    query: AnnouncementQueryInput,
    pagination: { limit: number; offset: number },
    actor: AnnouncementActor
  ): Promise<{ items: AnnouncementWithTargetsAndReadStatus[]; total: number }> {
    const createdBy = isAnnouncementManager(actor.role) ? undefined : actor.userId;
    return await announcementRepository.list(institutionCode, query, pagination, { createdBy });
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
   * Resolve the class-section IDs the viewer should receive class/section-targeted
   * announcements for. The auth middleware does not carry class membership, so it is
   * derived from the database here (feed + unread-count only).
   *
   * - students: their active enrollment (student_classes)
   * - parents: linked student (scope.linkedStudentUSN) enrollment
   * - teachers: classes they own (class-teacher + subject assignments)
   * - other roles: [] (they are covered by all/role targets)
   */
  async resolveViewerClassSections(
    institutionCode: string,
    userId: string,
    role: string
  ): Promise<string[]> {
    const normalizedRole = normalizeAnnouncementRole(role);
    if (!institutionCode || !userId) return [];

    if (normalizedRole !== 'student' && normalizedRole !== 'parent' && normalizedRole !== 'teacher') {
      return [];
    }

    try {
      const user = await dbFindUserByIdOrUid(userId);
      if (!user || (user.institutionCode && user.institutionCode !== institutionCode)) {
        return [];
      }

      if (normalizedRole === 'teacher') {
        return await announcementRepository.findTeacherClassIds(institutionCode, user.id);
      }

      let studentId = user.id;
      if (normalizedRole === 'parent') {
        // A parent sees announcements targeted at ANY of their linked children.
        const children = await resolveParentChildren(user.id);
        const sectionIds = new Set<string>();
        for (const child of children) {
          const cs = await dbFindStudentClassSectionId(child.studentId);
          if (cs) sectionIds.add(cs);
        }
        return Array.from(sectionIds);
      }

      const classSectionId = await dbFindStudentClassSectionId(studentId);
      return classSectionId ? [classSectionId] : [];
    } catch (err: any) {
      console.warn('[Announcements] Failed to resolve viewer class sections:', err?.message || err);
      return [];
    }
  }

  /**
   * Promote SCHEDULED announcements whose publish time has arrived.
   * Called by the in-process scheduler sweep.
   */
  async publishDueScheduledAnnouncements(): Promise<number> {
    return await announcementRepository.publishDueScheduled();
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
