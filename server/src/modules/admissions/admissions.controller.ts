import { FastifyRequest, FastifyReply } from 'fastify';
import { admissionsService } from './admissions.service.js';
import { normalizeRole } from '../shared/middleware/auth.js';
import { dbFindUserByIdOrUid } from '../shared/db/index.js';

const STAFF_ROLES = new Set(['admin', 'admission_officer', 'principal']);
const PARENT_STATUSES = new Set(['accepted', 'offer_declined']);

function forbidden(reply: FastifyReply, message: string) {
  return reply.status(403).send({
    success: false,
    error: { message, code: 'FORBIDDEN' },
  });
}

export class AdmissionsController {
  public async getAdmissions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const user = request.user;
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
        });
      }

      const role = normalizeRole(user.role);
      const isDev = role === 'dev';
      const isStaff = STAFF_ROLES.has(role);
      const isParent = role === 'parent';

      if (!isDev && !isStaff && !isParent) {
        return forbidden(reply, 'Admission records are only available to parents and admission staff.');
      }

      let parentId: string | undefined;
      let schoolId: string | undefined;

      if (isDev) {
        parentId = query?.parentId ? String(query.parentId) : undefined;
        schoolId = query?.schoolId ? String(query.schoolId) : undefined;
      } else if (isParent) {
        parentId = user.uid;
      } else {
        schoolId = user.institutionCode;
        if (!schoolId) {
          return forbidden(reply, 'No institution is assigned to this account.');
        }
        parentId = query?.parentId ? String(query.parentId) : undefined;
      }

      const items = await admissionsService.getAdmissions({ parentId, schoolId });
      return reply.send({ success: true, data: items });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({
        success: false,
        error: { message: err.message || 'Failed to fetch admissions', code: err.code || 'ADMISSION_FETCH_ERROR' },
      });
    }
  }

  public async createAdmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const user = request.user;
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
        });
      }

      const role = normalizeRole(user.role);
      const isDev = role === 'dev';
      const isStaff = STAFF_ROLES.has(role);
      const isParent = role === 'parent';

      if (!isDev && !isStaff && !isParent) {
        return forbidden(reply, 'Only parents and admission staff can submit admission applications.');
      }

      if (!body?.schoolId) {
        return reply.status(400).send({
          success: false,
          error: { message: 'schoolId is required', code: 'VALIDATION_ERROR' },
        });
      }

      let parentId = body.parentId;
      let parentName = body.parentName;
      let parentEmail = body.parentEmail;
      let schoolId = body.schoolId;

      if (isParent) {
        parentId = user.uid;
        parentEmail = user.email || '';
        parentName = body.parentName || '';
      } else if (isStaff) {
        if (!user.institutionCode) {
          return forbidden(reply, 'No institution is assigned to this account.');
        }
        schoolId = user.institutionCode;
        if (!parentId) {
          return reply.status(400).send({
            success: false,
            error: { message: 'parentId is required for staff-created applications', code: 'VALIDATION_ERROR' },
          });
        }
        const parentUser = await dbFindUserByIdOrUid(parentId);
        const parentInstitutionCode = (parentUser as any)?.institutionCode || '';
        if (!parentUser || parentInstitutionCode.toLowerCase() !== schoolId.toLowerCase()) {
          return reply.status(403).send({
            success: false,
            error: { message: 'Parent does not belong to this institution.', code: 'FORBIDDEN' },
          });
        }
      } else {
        parentId = body.parentId || `dev_${Date.now()}`;
      }

      const created = await admissionsService.createAdmission({
        ...body,
        schoolId,
        parentId,
        parentName,
        parentEmail,
      });

      return reply.status(201).send({ success: true, data: created });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({
        success: false,
        error: { message: err.message || 'Failed to submit admission', code: err.code || 'ADMISSION_CREATE_ERROR' },
      });
    }
  }

  public async updateAdmissionStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { status, entranceTestDate, entranceTestVenue, entranceTestInstructions } = request.body as any;
      const user = request.user;
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
        });
      }

      const role = normalizeRole(user.role);
      const isDev = role === 'dev';
      const isStaff = STAFF_ROLES.has(role);
      const isParent = role === 'parent';

      if (!isDev && !isStaff && !isParent) {
        return forbidden(reply, 'Only parents and admission staff can update admission status.');
      }

      const allowedStatuses = ['pending', 'test_scheduled', 'approved', 'accepted', 'rejected', 'offer_declined'];
      if (!status || !allowedStatuses.includes(status)) {
        return reply.status(400).send({
          success: false,
          error: { message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`, code: 'INVALID_STATUS' },
        });
      }

      if (isParent && !PARENT_STATUSES.has(status)) {
        return forbidden(reply, 'Parents can only accept or decline an offer.');
      }

      let scope: { parentId?: string; schoolId?: string } | undefined;
      if (isParent) {
        scope = { parentId: user.uid };
      } else if (isStaff) {
        if (!user.institutionCode) {
          return forbidden(reply, 'No institution is assigned to this account.');
        }
        scope = { schoolId: user.institutionCode };
      }

      const updated = await admissionsService.updateAdmissionStatus(
        id,
        status,
        { entranceTestDate, entranceTestVenue, entranceTestInstructions },
        scope
      );
      return reply.send({ success: true, data: updated });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({
        success: false,
        error: { message: err.message || 'Failed to update admission status', code: err.code || 'ADMISSION_UPDATE_ERROR' },
      });
    }
  }
}

export const admissionsController = new AdmissionsController();
