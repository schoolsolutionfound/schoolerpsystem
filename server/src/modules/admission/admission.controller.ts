import { FastifyRequest, FastifyReply } from 'fastify';
import { admissionService } from './admission.service.js';
import {
  CreateCourseSchema,
  UpdateCourseSchema,
  CreateApplicationSchema,
  UpdateApplicationSchema,
  AllocateSeatSchema,
  FormConfigSchema,
} from './admission.schema.js';

function getInstCode(request: FastifyRequest): string {
  return request.user?.institutionCode || '';
}

export class AdmissionController {
  // COURSES / SEAT MATRIX
  public async getCourses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const query = request.query as { academicYear?: string };
      const courses = await admissionService.getCourses(institutionCode, query.academicYear);
      return reply.send({ success: true, courses });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to fetch courses' },
      });
    }
  }

  public async createCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const payload = CreateCourseSchema.parse(request.body);
      const course = await admissionService.createCourse(institutionCode, payload);
      return reply.status(201).send({ success: true, course });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to create course' },
      });
    }
  }

  public async updateCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const { id } = request.params as { id: string };
      const payload = UpdateCourseSchema.parse(request.body);
      const course = await admissionService.updateCourse(institutionCode, id, payload);
      return reply.send({ success: true, course });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to update course' },
      });
    }
  }

  public async deleteCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const { id } = request.params as { id: string };
      const res = await admissionService.deleteCourse(institutionCode, id);
      return reply.send(res);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to delete course' },
      });
    }
  }

  // DASHBOARD STATS
  public async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const query = request.query as { academicYear?: string };
      const stats = await admissionService.getStats(institutionCode, query.academicYear);
      return reply.send({ success: true, stats });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to fetch admission statistics' },
      });
    }
  }

  // APPLICATIONS
  public async getApplications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const query = request.query as {
        academicYear?: string;
        status?: string;
        branchId?: string;
        quota?: string;
        search?: string;
      };
      const applications = await admissionService.getApplications(institutionCode, query);
      return reply.send({ success: true, applications });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to fetch applications' },
      });
    }
  }

  public async getApplicationById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const { id } = request.params as { id: string };
      const application = await admissionService.getApplicationById(institutionCode, id);
      return reply.send({ success: true, application });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Application not found' },
      });
    }
  }

  public async createApplication(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const payload = CreateApplicationSchema.parse(request.body);
      const application = await admissionService.createApplication(institutionCode, request.user?.uid || '', payload);
      return reply.status(201).send({ success: true, application });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to create student application' },
      });
    }
  }

  public async updateApplication(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const { id } = request.params as { id: string };
      const payload = UpdateApplicationSchema.parse(request.body);
      const application = await admissionService.updateApplication(institutionCode, id, payload);
      return reply.send({ success: true, application });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to update student application' },
      });
    }
  }

  // ALLOCATION ACTIONS
  public async allocateSeat(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const { id } = request.params as { id: string };
      const payload = AllocateSeatSchema.parse(request.body);
      const application = await admissionService.allocateSeat(institutionCode, id, payload);
      return reply.send({ success: true, application, message: 'Seat allocated successfully' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to allocate seat' },
      });
    }
  }

  public async unallocateSeat(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const { id } = request.params as { id: string };
      const body = (request.body as { notes?: string }) || {};
      const application = await admissionService.unallocateSeat(institutionCode, id, body.notes);
      return reply.send({ success: true, application, message: 'Seat unallocated successfully. Student moved back to Waiting List.' });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to unallocate seat' },
      });
    }
  }

  public async confirmSeat(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const { id } = request.params as { id: string };
      const body = (request.body as { notes?: string }) || {};
      const application = await admissionService.confirmSeat(institutionCode, id, body.notes);
      return reply.send({ success: true, application, message: 'Admission confirmed successfully! Seat locked.' });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to confirm seat' },
      });
    }
  }

  public async cancelApplication(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const { id } = request.params as { id: string };
      const body = (request.body as { notes?: string }) || {};
      const application = await admissionService.cancelApplication(institutionCode, id, body.notes);
      return reply.send({ success: true, application, message: 'Application cancelled.' });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to cancel application' },
      });
    }
  }

  // DYNAMIC FORM CONFIG
  public async getFormConfigs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const query = request.query as { programType?: string };
      const configs = await admissionService.getFormConfigs(institutionCode, query.programType);
      return reply.send({ success: true, configs });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to fetch form configs' },
      });
    }
  }

  public async saveFormConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const payload = FormConfigSchema.parse(request.body);
      const config = await admissionService.saveFormConfig(institutionCode, payload);
      return reply.status(201).send({ success: true, config });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to save form config' },
      });
    }
  }

  public async deleteFormConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const institutionCode = getInstCode(request);
      const { id } = request.params as { id: string };
      const res = await admissionService.deleteFormConfig(institutionCode, id);
      return reply.send(res);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to delete form config' },
      });
    }
  }
}

export const admissionController = new AdmissionController();
