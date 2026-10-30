import { describe, it, expect, vi, beforeEach } from 'vitest';

const { tx, withTransaction } = vi.hoisted(() => {
  const tx = {
    select: vi.fn(),
    update: vi.fn(),
  };
  return {
    tx,
    withTransaction: vi.fn(async (fn: (transaction: typeof tx) => unknown) => fn(tx)),
  };
});

vi.mock('../../shared/db/index.js', () => ({
  db: {},
  withTransaction,
}));

import { admissionService } from '../admission.service.js';

function mockLockedApplication(app: Record<string, any>) {
  const forUpdate = vi.fn().mockResolvedValue([app]);
  const where = vi.fn().mockReturnValue({ for: forUpdate });
  const from = vi.fn().mockReturnValue({ where });
  tx.select.mockReturnValue({ from });
}

function mockUpdatedApplication(app: Record<string, any>) {
  const returning = vi.fn().mockResolvedValue([app]);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  tx.update.mockReturnValue({ set });
  return { set, where, returning };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('admissionService cancellation and confirmation', () => {
  it('clears the allocated seat when an application is cancelled', async () => {
    mockLockedApplication({
      id: 'app-1',
      institutionCode: 'GIS001',
      status: 'allocated',
      allocatedCourseId: 'course-1',
      notes: 'existing note',
    });
    const { set } = mockUpdatedApplication({ id: 'app-1', status: 'cancelled' });

    const result = await admissionService.cancelApplication('GIS001', 'app-1');

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'cancelled',
        allocatedCourseId: null,
        allocatedCourseName: '',
        allocatedQuota: '',
        allocatedAt: null,
      })
    );
    expect(result).toMatchObject({ id: 'app-1', status: 'cancelled' });
  });

  it('does not confirm a cancelled application even if it has a stale allocation', async () => {
    mockLockedApplication({
      id: 'app-1',
      institutionCode: 'GIS001',
      status: 'cancelled',
      allocatedCourseId: 'course-1',
    });

    await expect(admissionService.confirmSeat('GIS001', 'app-1')).rejects.toMatchObject({
      statusCode: 400,
      code: 'APPLICATION_CANCELLED',
    });
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('does not allocate a seat to a cancelled application', async () => {
    mockLockedApplication({
      id: 'app-1',
      institutionCode: 'GIS001',
      status: 'cancelled',
      allocatedCourseId: null,
    });

    await expect(
      admissionService.allocateSeat('GIS001', 'app-1', { courseId: 'course-1', quota: 'General' })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'APPLICATION_CANCELLED',
    });
    expect(tx.update).not.toHaveBeenCalled();
  });
});
