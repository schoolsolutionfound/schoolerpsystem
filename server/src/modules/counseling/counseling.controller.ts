import { FastifyRequest, FastifyReply } from 'fastify';
import { counselingService } from './counseling.service.js';

export async function listCounselingRecordsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    const instCode = user?.institutionCode;
    if (!instCode) {
      return reply.status(403).send({
        success: false,
        error: { message: 'TENANT_REQUIRED: No institution assigned to current user account.' },
      });
    }

    const records = await counselingService.listRecords(instCode);
    return reply.send({ success: true, data: records });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to list counseling records' },
    });
  }
}

export async function createCounselingRecordHandler(request: FastifyRequest, reply: FastifyReply) {
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
    if (!body?.studentId || !body?.studentName || !body?.concernCategory) {
      return reply.status(400).send({
        success: false,
        error: { message: 'studentId, studentName, and concernCategory are required' },
      });
    }

    const created = await counselingService.createRecord(instCode, {
      studentId: body.studentId,
      studentName: body.studentName,
      gradeSection: body.gradeSection,
      counselorId: body.counselorId || user.uid,
      counselorName: body.counselorName || user.name || 'Guidance Counselor',
      concernCategory: body.concernCategory,
      severity: body.severity,
      actionPlan: body.actionPlan,
      parentContacted: body.parentContacted,
      status: body.status,
      date: body.date || new Date().toISOString().split('T')[0],
      lastFollowUpDate: body.lastFollowUpDate,
    });

    return reply.status(201).send({ success: true, data: created });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to create counseling record' },
    });
  }
}

export async function updateCounselingRecordHandler(request: FastifyRequest, reply: FastifyReply) {
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
    const body = request.body as any;

    const updated = await counselingService.updateRecord(instCode, id, {
      status: body.status,
      actionPlan: body.actionPlan,
      lastFollowUpDate: body.lastFollowUpDate || new Date().toISOString().split('T')[0],
      parentContacted: body.parentContacted,
    });

    if (!updated) {
      return reply.status(404).send({
        success: false,
        error: { message: 'Counseling record not found' },
      });
    }

    return reply.send({ success: true, data: updated });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to update counseling record' },
    });
  }
}
