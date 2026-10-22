import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../announcement.repository.js', () => ({
  announcementRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listUserFeed: vi.fn(),
    markRead: vi.fn(),
    getUnreadCount: vi.fn(),
    publishDueScheduled: vi.fn(),
    findTeacherClassIds: vi.fn(),
  },
}));

vi.mock('../../shared/db/index.js', () => ({
  db: null,
  dbFindUserById: vi.fn(),
  dbFindUserByIdOrUid: vi.fn(),
  dbFindStudentByUsnInInstitution: vi.fn(),
  dbFindStudentClassSectionId: vi.fn(),
}));

import { announcementService, AnnouncementActor } from '../announcement.service.js';
import { announcementRepository } from '../announcement.repository.js';
import {
  dbFindUserById,
  dbFindUserByIdOrUid,
  dbFindStudentByUsnInInstitution,
  dbFindStudentClassSectionId,
} from '../../shared/db/index.js';

const repo = announcementRepository as any;
const findUserById = vi.mocked(dbFindUserById);
const findUser = vi.mocked(dbFindUserByIdOrUid);
const findStudentByUsn = vi.mocked(dbFindStudentByUsnInInstitution);
const findEnrollment = vi.mocked(dbFindStudentClassSectionId);

const INST = 'TST001';
const admin: AnnouncementActor = { userId: 'uid-admin', role: 'admin' };
const teacher: AnnouncementActor = { userId: 'uid-teacher', role: 'teacher' };

function makeAnnouncement(overrides: Record<string, any> = {}) {
  return {
    id: 'ann1',
    institutionCode: INST,
    title: 'Title',
    content: 'Body',
    type: 'GENERAL',
    priority: 'NORMAL',
    status: 'DRAFT',
    createdBy: 'uid-teacher',
    publishAt: new Date(),
    expiresAt: null,
    imageUrl: '',
    attachmentUrl: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    targets: [],
    isRead: false,
    readCount: 0,
    ...overrides,
  } as any;
}

function makeCreateInput(overrides: Record<string, any> = {}) {
  return {
    title: 'Title',
    content: 'Body',
    type: 'GENERAL',
    priority: 'NORMAL',
    action: 'publish',
    publishAt: null,
    expiresAt: null,
    imageUrl: '',
    attachmentUrl: '',
    targets: [{ targetType: 'all', targetRole: '', classId: '', sectionId: '' }],
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveViewerClassSections (fix 1: class targeting delivery)', () => {
  it('returns [] for manager roles without touching the database', async () => {
    const result = await announcementService.resolveViewerClassSections(INST, 'uid-admin', 'admin');
    expect(result).toEqual([]);
    expect(findUser).not.toHaveBeenCalled();
    expect(repo.findTeacherClassIds).not.toHaveBeenCalled();
  });

  it('resolves a student to their active enrollment', async () => {
    findUser.mockResolvedValue({ id: 'stu1', institutionCode: INST } as any);
    findEnrollment.mockResolvedValue('cs9');

    const result = await announcementService.resolveViewerClassSections(INST, 'uid-student', 'student');

    expect(result).toEqual(['cs9']);
    expect(findEnrollment).toHaveBeenCalledWith('stu1');
  });

  it('rejects a user from another institution', async () => {
    findUser.mockResolvedValue({ id: 'stu1', institutionCode: 'OTHER001' } as any);

    const result = await announcementService.resolveViewerClassSections(INST, 'uid-student', 'student');

    expect(result).toEqual([]);
    expect(findEnrollment).not.toHaveBeenCalled();
  });

  it('resolves a parent through their linked student (parent_links / legacy scope)', async () => {
    findUser.mockResolvedValue({ id: 'par1', institutionCode: INST, scope: '{"linkedStudentUSN":"USN7"}' } as any);
    findUserById.mockResolvedValue({
      id: 'par1',
      role: 'parent',
      institutionCode: INST,
      scope: '{"linkedStudentUSN":"USN7"}',
    } as any);
    findStudentByUsn.mockResolvedValue({ id: 'stu2' } as any);
    findEnrollment.mockResolvedValue('cs5');

    const result = await announcementService.resolveViewerClassSections(INST, 'uid-parent', 'parent');

    expect(result).toEqual(['cs5']);
    expect(findStudentByUsn).toHaveBeenCalledWith(INST, 'USN7');
    expect(findEnrollment).toHaveBeenCalledWith('stu2');
  });

  it('returns [] for a parent without a linked student', async () => {
    findUser.mockResolvedValue({ id: 'par1', institutionCode: INST, scope: '{}' } as any);
    findUserById.mockResolvedValue({ id: 'par1', role: 'parent', institutionCode: INST, scope: '{}' } as any);

    const result = await announcementService.resolveViewerClassSections(INST, 'uid-parent', 'parent');

    expect(result).toEqual([]);
    expect(findStudentByUsn).not.toHaveBeenCalled();
  });

  it('resolves a teacher to classes they own', async () => {
    findUser.mockResolvedValue({ id: 'tch1', institutionCode: INST } as any);
    repo.findTeacherClassIds.mockResolvedValue(['cs1', 'cs2']);

    const result = await announcementService.resolveViewerClassSections(INST, 'uid-teacher', 'teacher');

    expect(result).toEqual(['cs1', 'cs2']);
    expect(repo.findTeacherClassIds).toHaveBeenCalledWith(INST, 'tch1');
  });

  it('degrades to [] when lookups fail instead of breaking the feed', async () => {
    findUser.mockRejectedValue(new Error('db down'));

    const result = await announcementService.resolveViewerClassSections(INST, 'uid-student', 'student');

    expect(result).toEqual([]);
  });
});

describe('getAnnouncement (fix 5b: drafts are not exposed to everyone)', () => {
  it('hides a DRAFT from a student with 404', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ status: 'DRAFT' }));

    await expect(announcementService.getAnnouncement(INST, 'ann1', 'uid-student', 'student')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('hides another user\'s DRAFT from a teacher with 404', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ status: 'DRAFT', createdBy: 'uid-someone-else' }));

    await expect(
      announcementService.getAnnouncement(INST, 'ann1', 'uid-teacher', 'teacher')
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
  });

  it('shows a DRAFT to its creator', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ status: 'DRAFT', createdBy: 'uid-teacher' }));

    const item = await announcementService.getAnnouncement(INST, 'ann1', 'uid-teacher', 'teacher');
    expect(item.id).toBe('ann1');
  });

  it('shows a DRAFT to a manager', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ status: 'DRAFT', createdBy: 'uid-teacher' }));

    const item = await announcementService.getAnnouncement(INST, 'ann1', 'uid-admin', 'principal');
    expect(item.id).toBe('ann1');
  });

  it('shows a PUBLISHED announcement to a student', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ status: 'PUBLISHED' }));

    const item = await announcementService.getAnnouncement(INST, 'ann1', 'uid-student', 'student');
    expect(item.id).toBe('ann1');
  });
});

describe('publishDueScheduledAnnouncements (fix 2: scheduled posts go live)', () => {
  it('delegates to the repository sweep and reports the promoted count', async () => {
    repo.publishDueScheduled.mockResolvedValue(3);

    const promoted = await announcementService.publishDueScheduledAnnouncements();

    expect(promoted).toBe(3);
    expect(repo.publishDueScheduled).toHaveBeenCalledTimes(1);
  });
});

describe('createAnnouncement authorization (fix 3: no institution-wide broadcast by non-managers)', () => {
  it('rejects a non-manager create that defaults to institution-wide targets', async () => {
    await expect(
      announcementService.createAnnouncement(INST, teacher, makeCreateInput())
    ).rejects.toMatchObject({ statusCode: 403, code: 'TARGET_NOT_ALLOWED' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects a non-manager create targeting a class they do not own', async () => {
    findUser.mockResolvedValue({ id: 'tch1', institutionCode: INST } as any);
    repo.findTeacherClassIds.mockResolvedValue(['cs-own']);

    await expect(
      announcementService.createAnnouncement(
        INST,
        teacher,
        makeCreateInput({
          targets: [{ targetType: 'class', targetRole: '', classId: 'cs-foreign', sectionId: 'cs-foreign' }],
        })
      )
    ).rejects.toMatchObject({ statusCode: 403, code: 'TARGET_NOT_OWNED' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('allows a non-manager create targeting their own class', async () => {
    findUser.mockResolvedValue({ id: 'tch1', institutionCode: INST } as any);
    repo.findTeacherClassIds.mockResolvedValue(['cs-own']);
    repo.create.mockResolvedValue(makeAnnouncement());

    await announcementService.createAnnouncement(
      INST,
      teacher,
      makeCreateInput({
        targets: [{ targetType: 'class', targetRole: '', classId: 'cs-own', sectionId: 'cs-own' }],
      })
    );

    expect(repo.create).toHaveBeenCalledWith(
      INST,
      expect.objectContaining({ createdBy: 'uid-teacher' }),
      [{ targetType: 'class', targetRole: '', classId: 'cs-own', sectionId: 'cs-own' }]
    );
  });

  it('allows a manager to broadcast institution-wide', async () => {
    repo.create.mockResolvedValue(makeAnnouncement());

    await announcementService.createAnnouncement(
      INST,
      { userId: 'uid-admin', role: 'institution admin' },
      makeCreateInput()
    );

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(findUser).not.toHaveBeenCalled();
  });
});

describe('ownership enforcement (fix 3: staff can only manage their own)', () => {
  it('blocks a teacher from updating someone else\'s announcement', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ createdBy: 'uid-other' }));

    await expect(
      announcementService.updateAnnouncement(INST, 'ann1', {}, teacher)
    ).rejects.toMatchObject({ statusCode: 403, code: 'NOT_ANNOUNCEMENT_OWNER' });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('allows a teacher to update their own announcement', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ createdBy: 'uid-teacher' }));
    repo.update.mockResolvedValue(makeAnnouncement({ title: 'Updated' }));

    await announcementService.updateAnnouncement(INST, 'ann1', { title: 'Updated' }, teacher);

    expect(repo.update).toHaveBeenCalledWith(INST, 'ann1', expect.anything(), undefined);
  });

  it('blocks a teacher from deleting someone else\'s draft', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ status: 'DRAFT', createdBy: 'uid-other' }));

    await expect(
      announcementService.deleteAnnouncement(INST, 'ann1', teacher)
    ).rejects.toMatchObject({ statusCode: 403, code: 'NOT_ANNOUNCEMENT_OWNER' });
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('lets a manager delete any draft', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ status: 'DRAFT', createdBy: 'uid-other' }));
    repo.delete.mockResolvedValue(true);

    const deleted = await announcementService.deleteAnnouncement(INST, 'ann1', admin);
    expect(deleted).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith(INST, 'ann1');
  });

  it('blocks a teacher from publishing someone else\'s announcement', async () => {
    repo.findById.mockResolvedValue(makeAnnouncement({ status: 'DRAFT', createdBy: 'uid-other' }));

    await expect(
      announcementService.publishAnnouncement(INST, 'ann1', teacher)
    ).rejects.toMatchObject({ statusCode: 403, code: 'NOT_ANNOUNCEMENT_OWNER' });
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe('listAnnouncements scoping (fix 3: teachers only see their own)', () => {
  it('scopes the management list to the creator for non-managers', async () => {
    repo.list.mockResolvedValue({ items: [], total: 0 });

    await announcementService.listAnnouncements(INST, {}, { limit: 100, offset: 0 }, teacher);

    expect(repo.list).toHaveBeenCalledWith(INST, {}, { limit: 100, offset: 0 }, { createdBy: 'uid-teacher' });
  });

  it('returns the whole institution list for managers', async () => {
    repo.list.mockResolvedValue({ items: [], total: 0 });

    await announcementService.listAnnouncements(INST, {}, { limit: 100, offset: 0 }, admin);

    expect(repo.list).toHaveBeenCalledWith(INST, {}, { limit: 100, offset: 0 }, { createdBy: undefined });
  });
});
