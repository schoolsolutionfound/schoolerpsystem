import { FastifyRequest, FastifyReply } from 'fastify';
import { developerService } from './developer.service.js';
import { CreateInstitutionSchema, UpdateInstitutionSchema } from '../institutions/institution.schema.js';
import { CreateAdminSchema, UpdateAdminSchema, ResetAdminPasswordSchema } from './developer.schema.js';

export class DeveloperController {
  public async createInstitution(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsed = CreateInstitutionSchema.parse(req.body);
      const result = await developerService.createInstitution(parsed, req.user?.email || 'unknown');
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

  /**
   * GET /developer/institutions
   * Query params: search, type (school|college),
   * status (active|trial|inactive|suspended, or non_active = inactive+suspended),
   * filter (legacy: type or status value), sort (newest|oldest|name_asc|name_desc),
   * page (1-based), limit (max 500), offset.
   *
   * Response shape:
   * - No query params → `data` is a plain array (legacy contract, used by the mobile app).
   * - Any query param  → `data` is `{ data, total, limit, offset }` (same shape as /developer/admins).
   */
  public async listInstitutions(
    req: FastifyRequest<{
      Querystring: {
        search?: string;
        type?: string;
        status?: string;
        filter?: string;
        sort?: string;
        page?: string;
        limit?: string;
        offset?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const q = req.query || {};
      const hasParams = Boolean(q.search || q.type || q.status || q.filter || q.sort || q.page || q.limit || q.offset);

      const filter = (q.filter || '').toLowerCase();
      let type: string | undefined;
      let status: string | undefined;
      if (q.type) type = q.type.toLowerCase();
      else if (filter === 'school' || filter === 'college') type = filter;
      if (q.status) status = q.status.toLowerCase();
      else if (['active', 'trial', 'inactive', 'suspended'].includes(filter)) status = filter;

      const sort: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | undefined =
        q.sort && ['newest', 'oldest', 'name_asc', 'name_desc'].includes(q.sort)
          ? (q.sort as 'newest' | 'oldest' | 'name_asc' | 'name_desc')
          : undefined;
      const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
      const page = Math.max(Number(q.page) || 1, 1);
      const offset =
        q.offset !== undefined ? Math.max(Number(q.offset) || 0, 0) : (page - 1) * limit;

      const result = await developerService.listInstitutions({
        search: q.search?.trim() || undefined,
        type,
        status,
        sort,
        limit,
        offset,
      });

      if (!hasParams) {
        return reply.status(200).send({ success: true, data: result.data });
      }
      return reply.status(200).send({ success: true, data: result });
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
      const result = await developerService.updateInstitution(req.params.id, parsed, req.user?.email || 'unknown');
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
      const result = await developerService.deleteInstitution(req.params.id, req.user?.email || 'unknown');
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

public async listAdmins(req: FastifyRequest<{ Querystring: { institutionCode?: string; limit?: string; offset?: string } }>, reply: FastifyReply) {
    try {
      const q = req.query || {};
      const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
      const offset = Math.max(Number(q.offset) || 0, 0);
      const admins = await developerService.listAdmins(q.institutionCode, limit, offset);
return reply.send({ success: true, data: admins });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch institution admins' },
      });
    }
  }

  public async createAdmin(req: FastifyRequest, reply: FastifyReply) {
    try {
      const parsed = CreateAdminSchema.parse(req.body);
      const result = await developerService.createAdmin(parsed, req.user?.email || 'unknown');
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

  public async updateAdmin(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsed = UpdateAdminSchema.parse(req.body);
      const result = await developerService.updateAdmin(req.params.id, parsed, req.user?.email || 'unknown');
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

  public async deleteAdmin(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await developerService.deleteAdmin(req.params.id, req.user?.email || 'unknown');
      return reply.status(200).send({ success: true, message: result.message });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An error occurred' },
      });
    }
  }

  public async resetAdminPassword(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsed = ResetAdminPasswordSchema.parse(req.body);
      const result = await developerService.resetAdminPassword(req.params.id, parsed.password, req.user?.email || 'unknown');
      return reply.status(200).send({ success: true, data: result });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message || 'Invalid password' },
        });
      }
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'An error occurred' },
      });
    }
  }

  /**
   * GET /developer/institutions/:id/stats — headcount + structure for one institution.
   */
  public async getInstitutionPeopleStats(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const result = await developerService.getInstitutionPeopleStats(req.params.id);
      return reply.status(200).send({ success: true, data: result });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Failed to fetch institution stats' },
      });
    }
  }

  /**
   * POST /developer/institutions/import — bulk-import institutions from CSV.
   * Body: { csv: string }
   */
  public async importInstitutions(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = (req.body || {}) as any;
      if (typeof body.csv !== 'string' || body.csv.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Request body must include a "csv" string.' },
        });
      }
      const result = await developerService.importInstitutions(body.csv, req.user?.email || 'unknown');
      return reply.status(200).send({ success: true, data: result });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Import failed' },
      });
    }
  }

  /**
   * GET /developer/institutions/export — CSV download (same filters as the list).
   */
  public async exportInstitutions(
    req: FastifyRequest<{
      Querystring: {
        search?: string;
        type?: string;
        status?: string;
        filter?: string;
        sort?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const q = req.query || {};
      const filter = (q.filter || '').toLowerCase();
      let type: string | undefined;
      let status: string | undefined;
      if (q.type) type = q.type.toLowerCase();
      else if (filter === 'school' || filter === 'college') type = filter;
      if (q.status) status = q.status.toLowerCase();
      else if (['active', 'trial', 'inactive', 'suspended'].includes(filter)) status = filter;

      const csv = await developerService.exportInstitutionsCsv({
        search: q.search?.trim() || undefined,
        type,
        status,
      });
      const filename = `institutions-export-${new Date().toISOString().slice(0, 10)}.csv`;
      reply.headers({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      return reply.status(200).send(csv);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        success: false,
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Export failed' },
      });
    }
  }

  /**
   * GET /developer/audit — paginated developer action history.
   * Query: action, targetType, limit (max 500), offset.
   */
  public async getAuditEvents(
    req: FastifyRequest<{
      Querystring: {
        action?: string;
        targetType?: string;
        limit?: string;
        offset?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const q = req.query || {};
      const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
      const offset = Math.max(Number(q.offset) || 0, 0);
      const result = await developerService.getAuditEvents({
        limit,
        offset,
        action: q.action?.trim() || undefined,
        targetType: q.targetType?.trim() || undefined,
      });
      return reply.status(200).send({ success: true, data: result });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch audit log' },
      });
    }
  }
}

export const developerController = new DeveloperController();
