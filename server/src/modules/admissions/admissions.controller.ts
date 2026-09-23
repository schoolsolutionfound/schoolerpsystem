import { FastifyRequest, FastifyReply } from 'fastify';
import { admissionsService } from './admissions.service.js';

export class AdmissionsController {
  public async getAdmissions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const user = (request as any).user;

      const isStaffRole = ['admin', 'institution admin', 'admission_officer'].includes(user?.role) ||
        (Array.isArray(user?.roles) && user.roles.some((r: string) => ['admin', 'institution admin', 'admission_officer'].includes(r)));
      const isDev = user?.role === 'dev' || (Array.isArray(user?.roles) && user.roles.includes('dev'));

      const parentId = query?.parentId || (user?.role === 'parent' ? user?.uid : undefined);

      // Multi-tenant isolation: School admin / admission officer only ever sees admissions for their school!
      let schoolId = query?.schoolId;
      if (isStaffRole && !isDev && user?.institutionCode && user.institutionCode !== 'DEFAULT') {
        schoolId = user.institutionCode;
      } else if (!schoolId && isStaffRole && user?.institutionCode) {
        schoolId = user.institutionCode;
      }

      const items = await admissionsService.getAdmissions({ parentId, schoolId });
      return reply.send({ success: true, data: items });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: { message: err.message || 'Failed to fetch admissions', code: 'ADMISSION_FETCH_ERROR' },
      });
    }
  }

  public async createAdmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const user = (request as any).user;

      const parentId = body.parentId || user?.uid || `anon_${Date.now()}`;
      const parentName = body.parentName || user?.name || '';
      const parentEmail = body.parentEmail || user?.email || '';

      const created = await admissionsService.createAdmission({
        ...body,
        parentId,
        parentName,
        parentEmail,
      });

      return reply.status(201).send({ success: true, data: created });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: { message: err.message || 'Failed to submit admission', code: 'ADMISSION_CREATE_ERROR' },
      });
    }
  }

  public async updateAdmissionStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { status, entranceTestDate, entranceTestVenue, entranceTestInstructions } = request.body as any;

      if (!status || !['pending', 'test_scheduled', 'accepted', 'rejected'].includes(status)) {
        return reply.status(400).send({
          success: false,
          error: { message: 'Invalid status. Must be pending, test_scheduled, accepted, or rejected.', code: 'INVALID_STATUS' },
        });
      }

      const updated = await admissionsService.updateAdmissionStatus(id, status, {
        entranceTestDate,
        entranceTestVenue,
        entranceTestInstructions,
      });
      return reply.send({ success: true, data: updated });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: { message: err.message || 'Failed to update admission status', code: 'ADMISSION_UPDATE_ERROR' },
      });
    }
  }
}

export const admissionsController = new AdmissionsController();
