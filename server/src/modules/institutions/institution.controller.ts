import { FastifyRequest, FastifyReply } from 'fastify';
import { institutionService } from './institution.service.js';
import { CreateInstitutionSchema, UpdateInstitutionSchema } from './institution.schema.js';

export class InstitutionController {
  public async createInstitution(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsed = CreateInstitutionSchema.parse(req.body);
      const result = await institutionService.createInstitution(parsed);
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

  public async getInstitutions(req: FastifyRequest, reply: FastifyReply) {
    try {
      const results = await institutionService.getInstitutions();
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
      const result = await institutionService.getInstitutionById(req.params.id);
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
      const result = await institutionService.updateInstitution(req.params.id, parsed);
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
      const result = await institutionService.deleteInstitution(req.params.id);
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

export const institutionController = new InstitutionController();
