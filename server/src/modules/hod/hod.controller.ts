import { FastifyRequest, FastifyReply } from 'fastify';
import { hodService } from './hod.service.js';

function getTenantAndDept(req: FastifyRequest): { instCode: string; department: string } {
  const user = (req as any).user;
  const instCode = user?.institutionCode;
  if (!instCode) {
    const err: any = new Error('TENANT_REQUIRED: No institution assigned to current user account.');
    err.statusCode = 403;
    throw err;
  }

  // E8: Extract department from user account; if admin/principal, allow query override
  let department = user?.department || '';
  if (!department && user.scope && typeof user.scope === 'object' && user.scope.department) {
    department = user.scope.department;
  } else if (!department && typeof user.scope === 'string') {
    try {
      const parsed = JSON.parse(user.scope);
      department = parsed.department || '';
    } catch {
      department = '';
    }
  }

  const role = (user.role || '').toLowerCase();
  const queryDept = (req.query as any)?.department;
  if ((role === 'admin' || role === 'principal' || !department) && queryDept) {
    department = queryDept;
  }

  return { instCode, department };
}

export async function getKPIsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode, department } = getTenantAndDept(request);
    const kpis = await hodService.getKPIs(instCode, department);
    return reply.send({ success: true, data: kpis });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch HOD KPIs' },
    });
  }
}

export async function getFacultyHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode, department } = getTenantAndDept(request);
    const faculty = await hodService.getFaculty(instCode, department);
    return reply.send({ success: true, data: faculty });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch HOD faculty' },
    });
  }
}

export async function getCoursesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode, department } = getTenantAndDept(request);
    const courses = await hodService.getCourses(instCode, department);
    return reply.send({ success: true, data: courses });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch department courses' },
    });
  }
}

export async function createCourseHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode, department } = getTenantAndDept(request);
    const body = request.body as any;
    if (!body?.code || !body?.name) {
      return reply.status(400).send({
        success: false,
        error: { message: 'Course code and name are required' },
      });
    }

    const created = await hodService.createCourse(instCode, {
      ...body,
      department: body.department || department || 'General Engineering',
    });
    return reply.status(201).send({ success: true, data: created });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to create department course' },
    });
  }
}

export async function assignCourseInstructorHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode } = getTenantAndDept(request);
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const facultyId = body?.facultyId || body?.instructorId;
    const facultyName = body?.facultyName || body?.instructorName;

    if (!facultyId) {
      return reply.status(400).send({
        success: false,
        error: { message: 'facultyId is required to assign instructor' },
      });
    }

    const updated = await hodService.assignCourseInstructor(instCode, id, {
      facultyId,
      facultyName,
    });

    return reply.send({ success: true, data: updated, course: updated });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to assign instructor to course' },
    });
  }
}

export async function getExamEligibilityHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode, department } = getTenantAndDept(request);
    const { semester } = (request.query as any) || {};
    const records = await hodService.getExamEligibility(instCode, department, semester);
    return reply.send({ success: true, data: records });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch exam eligibility records' },
    });
  }
}

export async function updateHallTicketStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode } = getTenantAndDept(request);
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const user = (request as any).user;

    const status = body?.status;
    const note = body?.note || body?.remarks;

    if (!status) {
      return reply.status(400).send({
        success: false,
        error: { message: 'Status is required (eligible | condonation_needed | detained)' },
      });
    }

    const updated = await hodService.updateHallTicketStatus(
      instCode,
      id,
      status,
      note,
      user?.name || 'Head of Department'
    );

    return reply.send({ success: true, data: updated, record: updated });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to update hall ticket status' },
    });
  }
}

export async function getNoticesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode, department } = getTenantAndDept(request);
    const notices = await hodService.getNotices(instCode, department);
    return reply.send({ success: true, data: notices });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch department notices' },
    });
  }
}

export async function createNoticeHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode, department } = getTenantAndDept(request);
    const body = request.body as any;
    const user = (request as any).user;

    if (!body?.title || !body?.content) {
      return reply.status(400).send({
        success: false,
        error: { message: 'Title and content are required' },
      });
    }

    const created = await hodService.createNotice(instCode, user, {
      ...body,
      department: body.department || department,
    });

    return reply.status(201).send({ success: true, data: created, notice: created });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to create department notice' },
    });
  }
}

export async function getStudentsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { instCode, department } = getTenantAndDept(request);
    const { semester, search } = (request.query as any) || {};
    const students = await hodService.getStudents(instCode, department, semester, search);
    return reply.send({ success: true, data: students });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch department students' },
    });
  }
}

