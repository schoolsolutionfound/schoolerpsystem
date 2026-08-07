import { FastifyRequest, FastifyReply } from 'fastify';
import { developerService } from './developer.service.js';
import { CreateInstitutionSchema, UpdateInstitutionSchema } from '../institutions/institution.schema.js';

export class DeveloperController {
  public async createInstitution(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsed = CreateInstitutionSchema.parse(req.body);
      const result = await developerService.createInstitution(parsed);
      return reply.status(201).send({ success: true, data: result });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message || 'Invalid input data' },
        });
      }
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An error occurred' },
      });
    }
  }

  public async listInstitutions(req: FastifyRequest, reply: FastifyReply) {
    try {
      const results = await developerService.listInstitutions();
      return reply.status(200).send({ success: true, data: results });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch institutions' },
      });
    }
  }

  public async getInstitutionById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await developerService.getInstitutionById(req.params.id);
      return reply.status(200).send({ success: true, data: result });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An error occurred' },
      });
    }
  }

  public async updateInstitution(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsed = UpdateInstitutionSchema.parse(req.body);
      const result = await developerService.updateInstitution(req.params.id, parsed);
      return reply.status(200).send({ success: true, data: result });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message || 'Invalid update payload' },
        });
      }
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An error occurred' },
      });
    }
  }

  public async deleteInstitution(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await developerService.deleteInstitution(req.params.id);
      return reply.status(200).send({ success: true, message: result.message });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An error occurred' },
      });
    }
  }

  public async getStats(req: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await developerService.getStats();
      return reply.status(200).send({ success: true, data: stats });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch developer stats' },
      });
    }
  }

  public async listAdmins(req: FastifyRequest<{ Querystring: { institutionCode?: string } }>, reply: FastifyReply) {
    try {
      const admins = await developerService.listAdmins(req.query.institutionCode);
      return reply.status(200).send({ success: true, data: admins });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch institution admins' },
      });
    }
  }

  public async createAdmin(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      if (!body.fullName || !body.email || !body.institutionCode) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Full name, email, and institution code are required.' },
        });
      }
      const result = await developerService.createAdmin(body);
      return reply.status(201).send({ success: true, data: result });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An error occurred' },
      });
    }
  }

  public async updateAdmin(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await developerService.updateAdmin(req.params.id, req.body as any);
      return reply.status(200).send({ success: true, data: result });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An error occurred' },
      });
    }
  }

  public async deleteAdmin(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await developerService.deleteAdmin(req.params.id);
      return reply.status(200).send({ success: true, message: result.message });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An error occurred' },
      });
    }
  }
}

export const developerController = new DeveloperController();
