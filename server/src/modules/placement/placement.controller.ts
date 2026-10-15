import { FastifyRequest, FastifyReply } from 'fastify';
import { placementService } from './placement.service.js';
import {
  AssignMemberSchema,
  UpdateProfileSchema,
  CreateDriveSchema,
  UpdateDriveSchema,
  ApplyDriveSchema,
  UpdateApplicationStatusSchema,
} from './placement.schema.js';
import { getCachedAuth } from '../shared/middleware/authCache.js';

export class PlacementController {
  // ADMIN
  public async assignMember(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = AssignMemberSchema.parse(request.body);
      const result = await placementService.assignMember(request.user!, payload);
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to assign placement member' },
      });
    }
  }
  public async searchMembers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await placementService.searchEligibleMembers(request.user!);
      return reply.send({ success: true, users });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to search members' },
      });
    }
  }

  public async listMembers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const members = await placementService.listMembers(request.user!);
      return reply.send({ success: true, members });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to list members' },
      });
    }
  }
  // STUDENT
  public async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const profile = await placementService.getStudentProfile(request.user!);
      return reply.send({ success: true, profile });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to get profile' },
      });
    }
  }

  public async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = UpdateProfileSchema.parse(request.body);
      const result = await placementService.updateStudentProfile(request.user!, payload);
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to update profile' },
      });
    }
  }

  public async applyForDrive(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { driveId } = request.params as { driveId: string };
      const payload = ApplyDriveSchema.parse(request.body || {});
      const result = await placementService.applyForDrive(request.user!, driveId, payload);
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to apply for drive' },
      });
    }
  }

  public async withdrawApplication(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { driveId } = request.params as { driveId: string };
      const result = await placementService.withdrawApplication(request.user!, driveId);
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to withdraw application' },
      });
    }
  }

  public async listStudentApplications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const applications = await placementService.listStudentApplications(request.user!);
      return reply.send({ success: true, applications });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to list applications' },
      });
    }
  }

  // STAFF - DRIVES
  public async createDrive(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = CreateDriveSchema.parse(request.body);
      const result = await placementService.createDrive(request.user!, payload);
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to create drive' },
      });
    }
  }

  public async updateDrive(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = UpdateDriveSchema.parse(request.body);
      const { driveId } = request.params as { driveId: string };
      const result = await placementService.updateDrive(request.user!, driveId, payload);
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to update drive' },
      });
    }
  }

  // EVERYONE - DRIVES
  public async listDrives(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cached = getCachedAuth(request.user!.uid);
      const accessLevel = (cached as any)?.placementAccess;
      const drives = await placementService.listDrives(request.user!, accessLevel);
      return reply.send({ success: true, drives });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to list drives' },
      });
    }
  }

  // STAFF - APPLICATIONS
  public async getDriveApplications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { driveId } = request.params as { driveId: string };
      const applications = await placementService.getDriveApplications(request.user!, driveId);
      return reply.send({ success: true, applications });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to get drive applications' },
      });
    }
  }

  public async updateApplicationStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { driveId, applicationId } = request.params as { driveId: string; applicationId: string };
      const payload = UpdateApplicationStatusSchema.parse(request.body);
      const result = await placementService.updateApplicationStatus(request.user!, driveId, applicationId, payload);
      return reply.send({ success: true, ...result });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ success: false, error: { message: 'Validation Error', details: error.errors } });
      }
      return reply.status(error.statusCode || 500).send({
        success: false,
        error: { message: error.message || 'Failed to update application status' },
      });
    }
  }
}

export const placementController = new PlacementController();
