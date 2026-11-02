import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createCourse } = vi.hoisted(() => ({
  createCourse: vi.fn(),
}));

vi.mock('../hod.service.js', () => ({
  hodService: { createCourse },
}));

import { createCourseHandler } from '../hod.controller.js';

function mockReply() {
  return {
    statusCode: 200,
    payload: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(payload: any) {
      this.payload = payload;
      return this;
    },
  };
}

function request(body: any) {
  return {
    body,
    query: {},
    user: { institutionCode: 'GIS001', department: 'Computer Science', role: 'hod', scope: {} },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createCourseHandler semester validation', () => {
  it('rejects a missing semester with 400 before touching the database', async () => {
    const reply = mockReply();
    await createCourseHandler(request({ code: 'CS101', name: 'Intro to CS' }), reply as any);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload.error.message).toMatch(/semester are required/);
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only semester with 400', async () => {
    const reply = mockReply();
    await createCourseHandler(request({ code: 'CS101', name: 'Intro to CS', semester: '   ' }), reply as any);

    expect(reply.statusCode).toBe(400);
    expect(createCourse).not.toHaveBeenCalled();
  });

  it('normalizes and forwards a numeric semester', async () => {
    createCourse.mockResolvedValue({ id: 'course-1' });
    const reply = mockReply();
    await createCourseHandler(request({ code: 'CS101', name: 'Intro to CS', semester: 3 }), reply as any);

    expect(reply.statusCode).toBe(201);
    expect(createCourse).toHaveBeenCalledWith(
      'GIS001',
      expect.objectContaining({ semester: '3', department: 'Computer Science' })
    );
  });
});
