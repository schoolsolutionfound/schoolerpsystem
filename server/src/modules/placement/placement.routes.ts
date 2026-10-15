import { FastifyInstance } from 'fastify';
import { placementController } from './placement.controller.js';
import { authenticate, requireAdmin } from '../shared/middleware/auth.js';
import { requirePlacementAccess, requireCollege, requirePlacementHead } from './placement.middleware.js';

export async function placementRoutes(fastify: FastifyInstance) {
  // --- Admin Routes ---
  fastify.post(
    '/members/assign',
    { preHandler: [authenticate, requireCollege, requirePlacementHead] },
    placementController.assignMember.bind(placementController)
  );

  fastify.get(
    '/members/search',
    { preHandler: [authenticate, requireCollege, requirePlacementHead] },
    placementController.searchMembers.bind(placementController)
  );

  fastify.get(
    '/members',
    { preHandler: [authenticate, requireCollege, requirePlacementAccess] },
    placementController.listMembers.bind(placementController)
  );

  // --- Student Profile Routes ---
  fastify.get(
    '/profile',
    { preHandler: [requireCollege] },
    placementController.getProfile.bind(placementController)
  );

  fastify.put(
    '/profile',
    { preHandler: [requireCollege] },
    placementController.updateProfile.bind(placementController)
  );

  fastify.get(
    '/applications',
    { preHandler: [requireCollege] },
    placementController.listStudentApplications.bind(placementController)
  );

  fastify.post(
    '/drives/:driveId/apply',
    { preHandler: [requireCollege] },
    placementController.applyForDrive.bind(placementController)
  );

  fastify.post(
    '/drives/:driveId/withdraw',
    { preHandler: [requireCollege] },
    placementController.withdrawApplication.bind(placementController)
  );

  // --- Drives (Staff CRUD) ---
  fastify.post(
    '/drives',
    { preHandler: [requireCollege, requirePlacementAccess] },
    placementController.createDrive.bind(placementController)
  );

  fastify.put(
    '/drives/:driveId',
    { preHandler: [requireCollege, requirePlacementAccess] },
    placementController.updateDrive.bind(placementController)
  );

  // --- Drives (Everyone list) ---
  fastify.get(
    '/drives',
    { preHandler: [requireCollege] },
    placementController.listDrives.bind(placementController)
  );

  // --- Staff Applications ---
  fastify.get(
    '/drives/:driveId/applications',
    { preHandler: [requireCollege, requirePlacementAccess] },
    placementController.getDriveApplications.bind(placementController)
  );

  fastify.put(
    '/drives/:driveId/applications/:applicationId/status',
    { preHandler: [requireCollege, requirePlacementAccess] },
    placementController.updateApplicationStatus.bind(placementController)
  );
}
