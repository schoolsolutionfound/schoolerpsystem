import { pgTable, text, timestamp, boolean, varchar, jsonb, integer, numeric, date, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const institutions = pgTable('institutions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
  institutionCode: varchar('institution_code', { length: 100 }).notNull().unique(),
  institutionName: text('institution_name').notNull(),
  institutionType: varchar('institution_type', { length: 50 }).notNull().default('college'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).notNull().default('active'),
  departments: jsonb('departments').$type<string[]>().default([]),
  academicYears: jsonb('academic_years').$type<string[]>().default([]),
  courses: jsonb('courses').$type<string[]>().default([]),
  terms: jsonb('terms').$type<{ academicYear: string; terms: string[] }[]>().default([]),
  blockedDates: jsonb('blocked_dates').$type<{ date: string; reason: string }[]>().default([]),
  // Admin-set default password for newly provisioned users (row password in
  // CSV/feed overrides it; never returned by API responses — only hasDefaultPassword).
  defaultTempPassword: varchar('default_temp_password', { length: 64 }).default(''),
  maintenanceEnabled: boolean('maintenance_enabled').notNull().default(false),
  maintenanceMinVersion: varchar('maintenance_min_version', { length: 50 }).notNull().default('0.0.0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type InstitutionRecord = typeof institutions.$inferSelect;
export type NewInstitutionRecord = typeof institutions.$inferInsert;

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: text('full_name').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('student'),
  institutionCode: varchar('institution_code', { length: 100 }).default(''),
  institutionName: text('institution_name').default(''),
  institutionType: varchar('institution_type', { length: 50 }).default('school'),
  rollNoOrUSN: varchar('roll_no_usn', { length: 100 }).default(''),
  mustChangePassword: boolean('must_change_password').default(false),
  profileCompleted: boolean('profile_completed').default(false),
  parentPhone: varchar('parent_phone', { length: 20 }).default(''),
  phone: varchar('student_phone', { length: 20 }).default(''),
  profilePicUrl: text('profile_pic_url').default(''),
  tenthPercentage: varchar('tenth_percentage', { length: 10 }).default(''),
  twelfthPercentage: varchar('twelfth_percentage', { length: 10 }).default(''),
  title: text('title').default(''),
  scope: jsonb('scope').$type<Record<string, any>>().default({}),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  graduatedAt: timestamp('graduated_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  institutionCodeIdx: index('idx_users_institution_code').on(table.institutionCode),
  // Covers institution-scoped role queries (admin lists, role-filtered counts).
  institutionRoleIdx: index('idx_users_institution_role').on(table.institutionCode, table.role),
  // Covers non-scoped role lookups (e.g. platform-wide admin counts) without a full scan.
  adminRoleIdx: index('idx_users_admin_role').on(table.role).where(sql`role = 'admin'`),
}));

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

export interface AuditEventRecord {
  id: string;
  actorEmail: string;
  action: string;
  targetType: 'institution' | 'admin' | 'platform';
  targetId?: string;
  targetLabel?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

export const auditEvents = pgTable('audit_events', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull().default('platform'),
  targetId: text('target_id'),
  targetLabel: text('target_label'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_audit_events_created_at').on(table.createdAt),
]);

export type AuditEventRow = typeof auditEvents.$inferSelect;

const idPrefix = (prefix: string) => () => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const classSections = pgTable('class_sections', {
  id: text('id').primaryKey().$defaultFn(idPrefix('cs')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  department: varchar('department', { length: 200 }).default(''),
  academicYear: varchar('academic_year', { length: 100 }).default(''),
  section: varchar('section', { length: 50 }).default(''),
  classTeacherId: text('class_teacher_id').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_class_sections_inst').on(table.institutionCode),
  teacherIdx: index('idx_class_sections_teacher').on(table.classTeacherId),
  nameUnique: uniqueIndex('uq_class_sections_inst_name').on(table.institutionCode, table.name),
}));

export type ClassSectionRecord = typeof classSections.$inferSelect;
export type NewClassSectionRecord = typeof classSections.$inferInsert;

export const subjects = pgTable('subjects', {
  id: text('id').primaryKey().$defaultFn(idPrefix('sub')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_subjects_inst').on(table.institutionCode),
  nameUnique: uniqueIndex('uq_subjects_inst_name').on(table.institutionCode, table.name),
}));

export type SubjectRecord = typeof subjects.$inferSelect;
export type NewSubjectRecord = typeof subjects.$inferInsert;

export const subjectTeachers = pgTable('subject_teachers', {
  id: text('id').primaryKey().$defaultFn(idPrefix('st')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  classSectionId: text('class_section_id').notNull(),
  subjectId: text('subject_id').notNull(),
  teacherId: text('teacher_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_subject_teachers_inst').on(table.institutionCode),
  classIdx: index('idx_subject_teachers_class').on(table.classSectionId),
  teacherIdx: index('idx_subject_teachers_teacher').on(table.teacherId),
  classSubjectUnique: uniqueIndex('uq_subject_teachers_class_subject').on(table.classSectionId, table.subjectId),
}));

export type SubjectTeacherRecord = typeof subjectTeachers.$inferSelect;
export type NewSubjectTeacherRecord = typeof subjectTeachers.$inferInsert;

export const periods = pgTable('periods', {
  id: text('id').primaryKey().$defaultFn(idPrefix('per')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  label: varchar('label', { length: 100 }).notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_periods_inst').on(table.institutionCode),
}));

export type PeriodRecord = typeof periods.$inferSelect;
export type NewPeriodRecord = typeof periods.$inferInsert;

export const timetables = pgTable('timetables', {
  id: text('id').primaryKey().$defaultFn(idPrefix('tt')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  classSectionId: text('class_section_id').notNull(),
  academicYear: varchar('academic_year', { length: 100 }).default(''),
  term: varchar('term', { length: 100 }).default(''),
  version: integer('version').notNull().default(1),
  effectiveFrom: date('effective_from').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_timetables_inst').on(table.institutionCode),
  classIdx: index('idx_timetables_class').on(table.classSectionId),
  classVersionUnique: uniqueIndex('uq_timetables_class_version').on(table.classSectionId, table.version),
}));

export type TimetableRecord = typeof timetables.$inferSelect;
export type NewTimetableRecord = typeof timetables.$inferInsert;

export const timetableSlots = pgTable('timetable_slots', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ts')),
  timetableId: text('timetable_id').notNull(),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  classSectionId: text('class_section_id').notNull(),
  subjectId: text('subject_id').notNull(),
  teacherId: text('teacher_id').notNull(),
  periodId: text('period_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  room: varchar('room', { length: 100 }).default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  timetableIdx: index('idx_timetable_slots_tt').on(table.timetableId),
  teacherIdx: index('idx_timetable_slots_teacher').on(table.teacherId),
  classIdx: index('idx_timetable_slots_class').on(table.classSectionId),
  slotUnique: uniqueIndex('uq_timetable_slots_tt_day_period').on(table.timetableId, table.dayOfWeek, table.periodId),
}));

export type TimetableSlotRecord = typeof timetableSlots.$inferSelect;
export type NewTimetableSlotRecord = typeof timetableSlots.$inferInsert;

export const attendanceRecords = pgTable('attendance_records', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ar')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  timetableSlotId: text('timetable_slot_id').notNull(),
  date: date('date').notNull(),
  takenByTeacherId: text('taken_by_teacher_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('submitted'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  lockedAt: timestamp('locked_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_attendance_records_inst').on(table.institutionCode),
  slotIdx: index('idx_attendance_records_slot').on(table.timetableSlotId),
  teacherIdx: index('idx_attendance_records_teacher').on(table.takenByTeacherId),
  dateIdx: index('idx_attendance_records_date').on(table.date),
  slotDateUnique: uniqueIndex('uq_attendance_records_slot_date').on(table.timetableSlotId, table.date),
}));

export type AttendanceRecordRecord = typeof attendanceRecords.$inferSelect;
export type NewAttendanceRecordRecord = typeof attendanceRecords.$inferInsert;

export const attendanceEntries = pgTable('attendance_entries', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ae')),
  attendanceRecordId: text('attendance_record_id').notNull(),
  studentId: text('student_id').notNull(),
  attendanceStatus: varchar('attendance_status', { length: 20 }).notNull().default('present'),
  remarks: text('remarks').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  recordIdx: index('idx_attendance_entries_record').on(table.attendanceRecordId),
  studentIdx: index('idx_attendance_entries_student').on(table.studentId),
  recordStudentUnique: uniqueIndex('uq_attendance_entries_record_student').on(table.attendanceRecordId, table.studentId),
}));

export type AttendanceEntryRecord = typeof attendanceEntries.$inferSelect;
export type NewAttendanceEntryRecord = typeof attendanceEntries.$inferInsert;

/**
 * Canonical student-to-class enrollment. Replaces the old `users.scope` string-triple
 * pattern (department/academicYear/section) for any new code paths. Old code keeps reading
 * `users.scope` until callers are migrated, so this is purely additive.
 */
export const studentClasses = pgTable('student_classes', {
  id: text('id').primaryKey().$defaultFn(idPrefix('sc')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  studentId: text('student_id').notNull(),
  classSectionId: text('class_section_id').notNull(),
  rollNo: varchar('roll_no', { length: 50 }).default(''),
  academicYear: varchar('academic_year', { length: 50 }).default(''),
  effectiveFrom: date('effective_from').notNull().default('2024-01-01'),
  effectiveTo: date('effective_to'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_student_classes_inst').on(table.institutionCode),
  studentIdx: index('idx_student_classes_student').on(table.studentId),
  classIdx: index('idx_student_classes_class').on(table.classSectionId),
  activeStudentIdx: index('idx_student_classes_active_student').on(table.studentId, table.isActive),
  classStudentYearUnique: uniqueIndex('uq_student_classes_class_student_year').on(
    table.classSectionId,
    table.studentId,
    table.academicYear
  ),
}));

export type StudentClassRecord = typeof studentClasses.$inferSelect;
export type NewStudentClassRecord = typeof studentClasses.$inferInsert;

/**
 * Marks module — exams per (class, term) with per-subject scores per student.
 *
 * exams        — one row per exam ("Unit Test 1", "Term 1 Final", etc.)
 * exam_subjects — which subjects are part of an exam + max marks per subject
 * marks        — actual scores: one row per (exam, subject, student)
 */
export const exams = pgTable('exams', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ex')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  term: varchar('term', { length: 100 }).default(''),
  academicYear: varchar('academic_year', { length: 50 }).default(''),
  startDate: date('start_date'),
  endDate: date('end_date'),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft | published | locked
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_exams_inst').on(table.institutionCode),
  statusIdx: index('idx_exams_status').on(table.status),
}));

export type ExamRecord = typeof exams.$inferSelect;
export type NewExamRecord = typeof exams.$inferInsert;

export const examSubjects = pgTable('exam_subjects', {
  id: text('id').primaryKey().$defaultFn(idPrefix('es')),
  examId: text('exam_id').notNull(),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  subjectId: text('subject_id').notNull(),
  maxMarks: integer('max_marks').notNull().default(100),
  passMarks: integer('pass_marks').notNull().default(35),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  examIdx: index('idx_exam_subjects_exam').on(table.examId),
  examSubjectUnique: uniqueIndex('uq_exam_subjects_exam_subject').on(table.examId, table.subjectId),
}));

export type ExamSubjectRecord = typeof examSubjects.$inferSelect;
export type NewExamSubjectRecord = typeof examSubjects.$inferInsert;

export const marks = pgTable('marks', {
  id: text('id').primaryKey().$defaultFn(idPrefix('mk')),
  examId: text('exam_id').notNull(),
  examSubjectId: text('exam_subject_id').notNull(),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  studentId: text('student_id').notNull(),
  classSectionId: text('class_section_id').notNull(),
  subjectId: text('subject_id').notNull(),
  marksObtained: numeric('marks_obtained', { precision: 6, scale: 2 }).notNull().default('0'),
  grade: varchar('grade', { length: 5 }).default(''),
  remarks: text('remarks').default(''),
  enteredBy: text('entered_by').notNull(),
  enteredAt: timestamp('entered_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  examIdx: index('idx_marks_exam').on(table.examId),
  studentIdx: index('idx_marks_student').on(table.studentId),
  classIdx: index('idx_marks_class').on(table.classSectionId),
  examSubjectStudentUnique: uniqueIndex('uq_marks_exam_subject_student').on(
    table.examSubjectId,
    table.studentId
  ),
}));

export type MarkRecord = typeof marks.$inferSelect;
export type NewMarkRecord = typeof marks.$inferInsert;

export const homework = pgTable('homework', {
  id: text('id').primaryKey().$defaultFn(idPrefix('hw')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  classSectionId: text('class_section_id').notNull(),
  subjectId: text('subject_id').notNull(),
  teacherId: text('teacher_id').notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description').default(''),
  dueDate: date('due_date').notNull(),
  assignedDate: date('assigned_date').notNull().default('2024-01-01'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  attachments: jsonb('attachments').$type<{ name: string; url: string }[]>().default([]),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_homework_inst').on(table.institutionCode),
  classIdx: index('idx_homework_class').on(table.classSectionId),
  teacherIdx: index('idx_homework_teacher').on(table.teacherId),
  subjectIdx: index('idx_homework_subject').on(table.subjectId),
  dueDateIdx: index('idx_homework_due_date').on(table.dueDate),
}));

export type HomeworkRecord = typeof homework.$inferSelect;
export type NewHomeworkRecord = typeof homework.$inferInsert;

export const studentDocuments = pgTable('student_documents', {
  id: text('id').primaryKey().$defaultFn(idPrefix('sd')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  studentId: text('student_id').notNull(),
  documentType: varchar('document_type', { length: 100 }).notNull(),
  fileName: text('file_name').default(''),
  fileUrl: text('file_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_student_documents_inst').on(table.institutionCode),
  studentIdx: index('idx_student_documents_student').on(table.studentId),
}));

export type StudentDocumentRecord = typeof studentDocuments.$inferSelect;
export type NewStudentDocumentRecord = typeof studentDocuments.$inferInsert;

export const feeStructures = pgTable('fee_structures', {
  id: text('id').primaryKey().$defaultFn(idPrefix('fs')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  classSectionId: text('class_section_id'),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull().default('student_fee'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  term: varchar('term', { length: 100 }),
  academicYear: varchar('academic_year', { length: 20 }),
  dueDate: date('due_date'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_fee_structures_inst').on(table.institutionCode),
  classIdx: index('idx_fee_structures_class').on(table.classSectionId),
  categoryIdx: index('idx_fee_structures_category').on(table.category),
}));

export type FeeStructureRecord = typeof feeStructures.$inferSelect;
export type NewFeeStructureRecord = typeof feeStructures.$inferInsert;

export const feePayments = pgTable('fee_payments', {
  id: text('id').primaryKey().$defaultFn(idPrefix('fp')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  feeStructureId: text('fee_structure_id').notNull(),
  studentId: text('student_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 30 }).notNull().default('upi'),
  paymentDate: date('payment_date'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  receiptNo: varchar('receipt_no', { length: 50 }),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_fee_payments_inst').on(table.institutionCode),
  studentIdx: index('idx_fee_payments_student').on(table.studentId),
  feeStructureIdx: index('idx_fee_payments_fee_structure').on(table.feeStructureId),
  statusIdx: index('idx_fee_payments_status').on(table.status),
}));

export type FeePaymentRecord = typeof feePayments.$inferSelect;
export type NewFeePaymentRecord = typeof feePayments.$inferInsert;

export const expenseRecords = pgTable('expense_records', {
  id: text('id').primaryKey().$defaultFn(idPrefix('exp')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull().default('other'),
  payeeName: varchar('payee_name', { length: 255 }).notNull(),
  employeeId: varchar('employee_id', { length: 100 }),
  designation: varchar('designation', { length: 100 }),
  department: varchar('department', { length: 100 }),
  vehicleNo: varchar('vehicle_no', { length: 50 }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 30 }).notNull().default('bank_transfer'),
  paymentDate: date('payment_date'),
  status: varchar('status', { length: 20 }).notNull().default('paid'),
  invoiceNo: varchar('invoice_no', { length: 50 }),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_expense_records_inst').on(table.institutionCode),
  categoryIdx: index('idx_expense_records_category').on(table.category),
  statusIdx: index('idx_expense_records_status').on(table.status),
}));

export type ExpenseRecordRow = typeof expenseRecords.$inferSelect;
export type NewExpenseRecordRow = typeof expenseRecords.$inferInsert;

// ============================================================================
// NOTIFICATION MODULE SCHEMAS
// ============================================================================

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ntf')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  recipientId: text('recipient_id').notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  body: text('body').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('general'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  channel: varchar('channel', { length: 20 }).notNull().default('push'),
  data: jsonb('data').$type<Record<string, any>>().default({}),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  readAt: timestamp('read_at'),
  sentAt: timestamp('sent_at'),
  failedAt: timestamp('failed_at'),
  errorMessage: text('error_message').default(''),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  recipientIdx: index('idx_notifications_recipient').on(table.recipientId, table.readAt),
  institutionIdx: index('idx_notifications_institution').on(table.institutionCode, table.createdAt),
  statusIdx: index('idx_notifications_status').on(table.status, table.createdAt),
  pendingIdx: index('idx_notifications_pending').on(table.status).where(sql`status = 'pending'`),
  typeIdx: index('idx_notifications_type').on(table.type),
}));

export type NotificationRecord = typeof notifications.$inferSelect;
export type NewNotificationRecord = typeof notifications.$inferInsert;

export const pushTokens = pgTable('push_tokens', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ptk')),
  userId: text('user_id').notNull(),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  token: text('token').notNull().unique(),
  platform: varchar('platform', { length: 20 }).notNull(),
  deviceName: varchar('device_name', { length: 200 }).default(''),
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('idx_push_tokens_user').on(table.userId, table.isActive),
  institutionIdx: index('idx_push_tokens_institution').on(table.institutionCode),
  tokenUnique: uniqueIndex('uq_push_tokens_token').on(table.token),
}));

export type PushTokenRecord = typeof pushTokens.$inferSelect;
export type NewPushTokenRecord = typeof pushTokens.$inferInsert;

export const notificationTemplates = pgTable('notification_templates', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ntm')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull().default('push'),
  titleTemplate: varchar('title_template', { length: 300 }).notNull(),
  bodyTemplate: text('body_template').notNull(),
  locale: varchar('locale', { length: 10 }).notNull().default('en'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  institutionIdx: index('idx_notification_templates_inst').on(table.institutionCode),
  typeIdx: index('idx_notification_templates_type').on(table.institutionCode, table.type),
}));

export type NotificationTemplateRecord = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplateRecord = typeof notificationTemplates.$inferInsert;

export const notificationCampaigns = pgTable('notification_campaigns', {
  id: text('id').primaryKey().$defaultFn(idPrefix('cmp')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  body: text('body').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('announcement'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  channel: varchar('channel', { length: 20 }).notNull().default('push'),
  target: jsonb('target').$type<Record<string, any>>().notNull().default({}),
  scheduledAt: timestamp('scheduled_at'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  totalCount: integer('total_count').notNull().default(0),
  sentCount: integer('sent_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  institutionIdx: index('idx_notification_campaigns_inst').on(table.institutionCode, table.createdAt),
  statusIdx: index('idx_notification_campaigns_status').on(table.status),
}));

export type NotificationCampaignRecord = typeof notificationCampaigns.$inferSelect;
export type NewNotificationCampaignRecord = typeof notificationCampaigns.$inferInsert;

export const notificationAuditLog = pgTable('notification_audit_log', {
  id: text('id').primaryKey().$defaultFn(idPrefix('nal')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  notificationId: text('notification_id'),
  campaignId: text('campaign_id'),
  userId: text('user_id'),
  details: jsonb('details').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  institutionIdx: index('idx_notification_audit_inst').on(table.institutionCode, table.createdAt),
  actionIdx: index('idx_notification_audit_action').on(table.action),
  notificationIdx: index('idx_notification_audit_notification').on(table.notificationId),
}));

export type NotificationAuditLogRecord = typeof notificationAuditLog.$inferSelect;
export type NewNotificationAuditLogRecord = typeof notificationAuditLog.$inferInsert;

export const notificationPreferences = pgTable('notification_preferences', {
  id: text('id').primaryKey().$defaultFn(idPrefix('npf')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  userId: text('user_id').notNull(),
  pushEnabled: boolean('push_enabled').notNull().default(true),
  disabledTypes: jsonb('disabled_types').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('idx_notification_preferences_user').on(table.userId),
  userUnique: uniqueIndex('uq_notification_preferences_user').on(table.userId),
}));

export type NotificationPreferenceRecord = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferenceRecord = typeof notificationPreferences.$inferInsert;
