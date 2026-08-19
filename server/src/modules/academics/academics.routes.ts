import { FastifyInstance } from 'fastify';
import {
  listClassSectionsHandler,
  createClassSectionHandler,
  updateClassSectionHandler,
  deleteClassSectionHandler,
  listSubjectsHandler,
  createSubjectHandler,
  listSubjectTeachersHandler,
  createSubjectTeacherHandler,
  deleteSubjectTeacherHandler,
  listPeriodsHandler,
  createPeriodHandler,
  updateTermsHandler,
  updateHolidaysHandler,
  createTimetableHandler,
  getClassTimetableHandler,
  getTeacherTimetableHandler,
  getMyTimetableHandler,
  getMyClassSectionHandler,
  getAllTimetablesForClassHandler,
  getRosterHandler,
  markAttendanceHandler,
  getAttendanceForSlotHandler,
  getStudentAttendanceHistoryHandler,
  getParentAttendanceHandler,
  getDepartmentOverviewHandler,
  getInstitutionOverviewHandler,
  getClassAttendanceHandler,
} from './academics.controller.js';
import { authenticate, requireAdmin, requireTeacherOrAdmin, requireStaff, requireRole } from '../shared/middleware/auth.js';

export async function academicsRoutes(fastify: FastifyInstance) {
  // Class Sections
  fastify.get('/class-sections', { preHandler: [authenticate] }, (req, reply) => listClassSectionsHandler(req, reply));
  fastify.post('/class-sections', { preHandler: [requireAdmin] }, (req, reply) => createClassSectionHandler(req, reply));
  fastify.put('/class-sections/:id', { preHandler: [requireAdmin] }, (req, reply) => updateClassSectionHandler(req as any, reply));
  fastify.delete('/class-sections/:id', { preHandler: [requireAdmin] }, (req, reply) => deleteClassSectionHandler(req as any, reply));

  // Subjects
  fastify.get('/subjects', { preHandler: [authenticate] }, (req, reply) => listSubjectsHandler(req, reply));
  fastify.post('/subjects', { preHandler: [requireAdmin] }, (req, reply) => createSubjectHandler(req, reply));

  // Subject Teachers
  fastify.get('/subject-teachers', { preHandler: [authenticate] }, (req, reply) => listSubjectTeachersHandler(req, reply));
  fastify.post('/subject-teachers', { preHandler: [requireAdmin] }, (req, reply) => createSubjectTeacherHandler(req, reply));
  fastify.delete('/subject-teachers/:id', { preHandler: [requireAdmin] }, (req, reply) => deleteSubjectTeacherHandler(req as any, reply));

  // Periods
  fastify.get('/periods', { preHandler: [authenticate] }, (req, reply) => listPeriodsHandler(req, reply));
  fastify.post('/periods', { preHandler: [requireAdmin] }, (req, reply) => createPeriodHandler(req, reply));

  // Config (terms + holiday calendar)
  fastify.put('/config/terms', { preHandler: [requireAdmin] }, (req, reply) => updateTermsHandler(req, reply));
  fastify.put('/config/holidays', { preHandler: [requireAdmin] }, (req, reply) => updateHolidaysHandler(req, reply));

  // Timetable
  fastify.post('/timetable', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => createTimetableHandler(req, reply));
  fastify.get('/timetable/class', { preHandler: [authenticate] }, (req, reply) => getClassTimetableHandler(req, reply));
  fastify.get('/timetable/teacher', { preHandler: [authenticate] }, (req, reply) => getTeacherTimetableHandler(req, reply));
  fastify.get('/timetable/me', { preHandler: [authenticate] }, (req, reply) => getMyTimetableHandler(req, reply));
  fastify.get('/timetable/my-class', { preHandler: [authenticate] }, (req, reply) => getMyClassSectionHandler(req, reply));
  fastify.get('/timetable/class/:id/versions', { preHandler: [authenticate] }, (req, reply) => getAllTimetablesForClassHandler(req as any, reply));

  // Attendance
  fastify.get('/attendance/roster', { preHandler: [requireStaff] }, (req, reply) => getRosterHandler(req, reply));
  fastify.post('/attendance/mark', { preHandler: [requireStaff], config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, (req, reply) => markAttendanceHandler(req, reply));
  fastify.get('/attendance/slot', { preHandler: [requireStaff] }, (req, reply) => getAttendanceForSlotHandler(req, reply));
  fastify.get('/attendance/history/student', { preHandler: [requireRole('student')] }, (req, reply) => getStudentAttendanceHistoryHandler(req, reply));
  fastify.get('/attendance/history/parent', { preHandler: [requireRole('parent')] }, (req, reply) => getParentAttendanceHandler(req, reply));
  fastify.get('/attendance/stats/department', { preHandler: [requireStaff] }, (req, reply) => getDepartmentOverviewHandler(req, reply));
  fastify.get('/attendance/stats/institution', { preHandler: [requireStaff] }, (req, reply) => getInstitutionOverviewHandler(req, reply));
  fastify.get('/attendance/class', { preHandler: [requireStaff] }, (req, reply) => getClassAttendanceHandler(req, reply));
}
