import { FastifyInstance } from 'fastify';
import {
  listClassSectionsHandler,
  createClassSectionHandler,
  updateClassSectionHandler,
  deleteClassSectionHandler,
  listAcademicSessionsHandler,
  createAcademicSessionHandler,
  updateAcademicSessionHandler,
  setAcademicSessionCurrentHandler,
  deleteAcademicSessionHandler,
  getClassSectionStudentsHandler,
  listSubjectsHandler,
  createSubjectHandler,
  listSubjectTeachersHandler,
  createSubjectTeacherHandler,
  updateSubjectTeacherHandler,
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
  getParentMarksHandler,
  getParentTimetableHandler,
  getDepartmentOverviewHandler,
  getInstitutionOverviewHandler,
  getClassAttendanceHandler,
  exportClassAttendanceHandler,
  getClassAttendanceReportHandler,
  listExamsHandler,
  getExamHandler,
  createExamHandler,
  updateExamHandler,
  getMarksForClassHandler,
  saveMarksHandler,
  getMyMarksHandler,
  getStudentMarksByIdHandler,
  createHomeworkHandler,
  listHomeworkByClassHandler,
  listMyHomeworkHandler,
  getHomeworkByIdHandler,
  updateHomeworkHandler,
  deleteHomeworkHandler,
  listStudentHomeworkHandler,
  listParentHomeworkHandler,
} from './academics.controller.js';
import { authenticate, requireAdmin, requireAdminOrPrincipal, requireTeacherOrAdmin, requireStaff, requireRole } from '../shared/middleware/auth.js';

export async function academicsRoutes(fastify: FastifyInstance) {
  // Academic Sessions (years)
  fastify.get('/academic-sessions', { preHandler: [authenticate] }, (req, reply) => listAcademicSessionsHandler(req, reply));
  fastify.post('/academic-sessions', { preHandler: [requireAdmin] }, (req, reply) => createAcademicSessionHandler(req, reply));
  fastify.put('/academic-sessions/:id', { preHandler: [requireAdmin] }, (req, reply) => updateAcademicSessionHandler(req as any, reply));
  fastify.post('/academic-sessions/:id/set-current', { preHandler: [requireAdmin] }, (req, reply) => setAcademicSessionCurrentHandler(req as any, reply));
  fastify.delete('/academic-sessions/:id', { preHandler: [requireAdmin] }, (req, reply) => deleteAcademicSessionHandler(req as any, reply));

  // Class Sections (staff only; students/parents cannot view staff class sections)
  fastify.get('/class-sections', { preHandler: [requireStaff] }, (req, reply) => listClassSectionsHandler(req, reply));
  fastify.get('/class-sections/:id/students', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getClassSectionStudentsHandler(req as any, reply));
  fastify.post('/class-sections', { preHandler: [requireAdminOrPrincipal] }, (req, reply) => createClassSectionHandler(req, reply));
  fastify.put('/class-sections/:id', { preHandler: [requireRole('admin', 'principal', 'hod')] }, (req, reply) => updateClassSectionHandler(req as any, reply));
  fastify.delete('/class-sections/:id', { preHandler: [requireAdminOrPrincipal] }, (req, reply) => deleteClassSectionHandler(req as any, reply));

  // Subjects
  fastify.get('/subjects', { preHandler: [authenticate] }, (req, reply) => listSubjectsHandler(req, reply));
  fastify.post('/subjects', { preHandler: [requireAdmin] }, (req, reply) => createSubjectHandler(req, reply));

  // Subject Teachers
  fastify.get('/subject-teachers', { preHandler: [authenticate] }, (req, reply) => listSubjectTeachersHandler(req, reply));
  fastify.post('/subject-teachers', { preHandler: [requireAdmin] }, (req, reply) => createSubjectTeacherHandler(req, reply));
  fastify.put('/subject-teachers/:id', { preHandler: [requireAdmin] }, (req, reply) => updateSubjectTeacherHandler(req as any, reply));
  fastify.delete('/subject-teachers/:id', { preHandler: [requireAdmin] }, (req, reply) => deleteSubjectTeacherHandler(req as any, reply));

  // Periods
  fastify.get('/periods', { preHandler: [authenticate] }, (req, reply) => listPeriodsHandler(req, reply));
  fastify.post('/periods', { preHandler: [requireAdmin] }, (req, reply) => createPeriodHandler(req, reply));

  // Config (terms + holiday calendar)
  fastify.put('/config/terms', { preHandler: [requireAdmin] }, (req, reply) => updateTermsHandler(req, reply));
  fastify.put('/config/holidays', { preHandler: [requireAdmin] }, (req, reply) => updateHolidaysHandler(req, reply));

  // Timetable
  fastify.post('/timetable', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => createTimetableHandler(req, reply));
  fastify.get('/timetable/class', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getClassTimetableHandler(req, reply));
  fastify.get('/timetable/teacher', { preHandler: [authenticate] }, (req, reply) => getTeacherTimetableHandler(req, reply));
  fastify.get('/timetable/me', { preHandler: [authenticate] }, (req, reply) => getMyTimetableHandler(req, reply));
  fastify.get('/timetable/my-class', { preHandler: [authenticate] }, (req, reply) => getMyClassSectionHandler(req, reply));
  fastify.get('/timetable/class/:id/versions', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getAllTimetablesForClassHandler(req as any, reply));

  // Attendance
  fastify.get('/attendance/roster', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getRosterHandler(req, reply));
  fastify.post('/attendance/mark', { preHandler: [requireTeacherOrAdmin], config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, (req, reply) => markAttendanceHandler(req, reply));
  fastify.get('/attendance/slot', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getAttendanceForSlotHandler(req, reply));
  fastify.get('/attendance/history/student', { preHandler: [requireRole('student')] }, (req, reply) => getStudentAttendanceHistoryHandler(req, reply));
  fastify.get('/attendance/history/parent', { preHandler: [requireRole('parent')] }, (req, reply) => getParentAttendanceHandler(req, reply));
  fastify.get('/attendance/stats/department', { preHandler: [requireRole('admin', 'principal', 'hod')] }, (req, reply) => getDepartmentOverviewHandler(req, reply));
  fastify.get('/attendance/stats/institution', { preHandler: [requireAdminOrPrincipal] }, (req, reply) => getInstitutionOverviewHandler(req, reply));
  fastify.get('/attendance/class', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getClassAttendanceHandler(req, reply));
  fastify.get('/attendance/export', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => exportClassAttendanceHandler(req, reply));
  fastify.get('/attendance/report', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getClassAttendanceReportHandler(req, reply));

  // Marks / Exams
  fastify.get('/exams', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => listExamsHandler(req, reply));
  fastify.get('/exams/:id', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getExamHandler(req as any, reply));
  fastify.post('/exams', { preHandler: [requireAdmin] }, (req, reply) => createExamHandler(req, reply));
  fastify.put('/exams/:id', { preHandler: [requireAdmin] }, (req, reply) => updateExamHandler(req as any, reply));
  fastify.get('/marks', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getMarksForClassHandler(req as any, reply));
  fastify.post('/marks', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => saveMarksHandler(req, reply));
  fastify.get('/marks/student/:studentId', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => getStudentMarksByIdHandler(req as any, reply));
  fastify.get('/marks/me', { preHandler: [requireRole('student')] }, (req, reply) => getMyMarksHandler(req, reply));
  fastify.get('/marks/parent', { preHandler: [requireRole('parent')] }, (req, reply) => getParentMarksHandler(req, reply));

  // Parent timetable
  fastify.get('/timetable/parent', { preHandler: [requireRole('parent')] }, (req, reply) => getParentTimetableHandler(req, reply));

  // Homework
  fastify.post('/homework', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => createHomeworkHandler(req, reply));
  fastify.get('/homework', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => listHomeworkByClassHandler(req, reply));
  fastify.get('/homework/mine', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => listMyHomeworkHandler(req, reply));
  fastify.get('/homework/student', { preHandler: [requireRole('student')] }, (req, reply) => listStudentHomeworkHandler(req, reply));
  fastify.get('/homework/parent', { preHandler: [requireRole('parent')] }, (req, reply) => listParentHomeworkHandler(req, reply));
  fastify.get('/homework/:id', { preHandler: [authenticate] }, (req, reply) => getHomeworkByIdHandler(req as any, reply));
  fastify.put('/homework/:id', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => updateHomeworkHandler(req as any, reply));
  fastify.delete('/homework/:id', { preHandler: [requireTeacherOrAdmin] }, (req, reply) => deleteHomeworkHandler(req as any, reply));
}
