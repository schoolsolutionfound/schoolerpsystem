import { pgTable, text, timestamp, boolean, varchar, jsonb, integer, numeric, bigint, date, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const institutions = pgTable('institutions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
  institutionCode: varchar('institution_code', { length: 100 }).notNull().unique(),
  institutionName: text('institution_name').notNull(),
  institutionType: varchar('institution_type', { length: 50 }).notNull().default('school'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).notNull().default('active'),
  departments: jsonb('departments').$type<string[]>().default([]),
  academicYears: jsonb('academic_years').$type<string[]>().default([]),
  // College years of study (1st Year, 2nd Year, …). School classes stay in
  // academicYears; academic sessions (e.g. 2026-27) live in academic_sessions.
  yearsOfStudy: jsonb('years_of_study').$type<string[]>().default([]),
  courses: jsonb('courses').$type<string[]>().default([]),
  sections: jsonb('sections').$type<string[]>().default([]),
  classSubjects: jsonb('class_subjects').$type<Record<string, string[]>>().default({}),
  terms: jsonb('terms').$type<{ academicYear: string; terms: string[] }[]>().default([]),
  blockedDates: jsonb('blocked_dates').$type<{ date: string; reason: string }[]>().default([]),
  // Per-role profile form fields configured by the institution admin from
  // Settings → Form Fields. Shape: { [role]: ProfileFormField[] } — see
  // modules/admin/profileFields.schema.ts. The 5 account basics (First Name,
  // Last Name, Email, Phone Number, Password) are always collected at
  // creation and are NOT part of this config.
  profileFormFields: jsonb('profile_form_fields').$type<Record<string, any[]>>().default({}),
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
  // Email verification state. Defaults true so pre-existing seeded/provisioned
  // accounts keep working; new signups set it false until the token is consumed.
  emailVerified: boolean('email_verified').notNull().default(true),
  emailVerifiedAt: timestamp('email_verified_at'),
  parentPhone: varchar('parent_phone', { length: 20 }).default(''),
  phone: varchar('student_phone', { length: 20 }).default(''),
  profilePicUrl: text('profile_pic_url').default(''),
  dob: varchar('dob', { length: 20 }).default(''),
  gender: varchar('gender', { length: 20 }).default(''),
  admissionNo: varchar('admission_no', { length: 100 }).default(''),
  admissionDate: varchar('admission_date', { length: 20 }).default(''),
  address: text('address').default(''),
  city: varchar('city', { length: 100 }).default(''),
  pincode: varchar('pincode', { length: 10 }).default(''),
  guardianName: varchar('guardian_name', { length: 200 }).default(''),
  guardianRelation: varchar('guardian_relation', { length: 50 }).default(''),
  guardianEmail: varchar('guardian_email', { length: 255 }).default(''),
  tenthPercentage: varchar('tenth_percentage', { length: 10 }).default(''),
  twelfthPercentage: varchar('twelfth_percentage', { length: 10 }).default(''),
  alternatePhone: varchar('alternate_phone', { length: 20 }).default(''),
  occupation: varchar('occupation', { length: 120 }).default(''),
  emergencyContact: varchar('emergency_contact', { length: 255 }).default(''),
  preferredLanguage: varchar('preferred_language', { length: 50 }).default(''),
  title: text('title').default(''),
  scope: jsonb('scope').$type<Record<string, any>>().default({}),
  roles: jsonb('roles').$type<string[]>().default([]),
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
  targetType: 'institution' | 'admin' | 'platform' | 'user';
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

/**
 * Academic sessions ("years") — e.g. "2026-27".
 * One row per institution per year; `isCurrent` marks the active year that
 * new class sections, enrollments, exams and timetables are stamped with.
 * NOTE: class_sections.academicYear stores the SECTION letter for schools —
 * do NOT confuse it with this table's year concept.
 */
export const academicSessions = pgTable('academic_sessions', {
  id: text('id').primaryKey().$defaultFn(idPrefix('as')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  startDate: varchar('start_date', { length: 20 }).default(''),
  endDate: varchar('end_date', { length: 20 }).default(''),
  isCurrent: boolean('is_current').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_academic_sessions_inst').on(table.institutionCode),
  nameUnique: uniqueIndex('uq_academic_sessions_inst_name').on(table.institutionCode, table.name),
}));

export type AcademicSessionRecord = typeof academicSessions.$inferSelect;
export type NewAcademicSessionRecord = typeof academicSessions.$inferInsert;

export const classSections = pgTable('class_sections', {
  id: text('id').primaryKey().$defaultFn(idPrefix('cs')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  department: varchar('department', { length: 200 }).default(''),
  academicYear: varchar('academic_year', { length: 100 }).default(''),
  section: varchar('section', { length: 50 }).default(''),
  classTeacherId: text('class_teacher_id').default(''),
  sessionId: varchar('session_id', { length: 100 }).default(''),
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
  sessionId: varchar('session_id', { length: 100 }).default(''),
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
  sessionId: varchar('session_id', { length: 100 }).default(''),
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
 * Parent → student links: the source of truth for which children a parent may
 * access, with a per-child relationship and permission list. Replaces the
 * legacy single-child `users.scope.linkedStudentUSN` value, which is still
 * READ as a fallback for rows created before this table existed.
 */
export const parentLinks = pgTable('parent_links', {
  id: text('id').primaryKey().$defaultFn(idPrefix('pl')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  parentId: text('parent_id').notNull(),
  studentId: text('student_id').notNull(),
  relationship: varchar('relationship', { length: 50 }).default(''),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  isPrimary: boolean('is_primary').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  parentIdx: index('idx_parent_links_parent').on(table.parentId),
  studentIdx: index('idx_parent_links_student').on(table.studentId),
  instIdx: index('idx_parent_links_inst').on(table.institutionCode),
  pairUnique: uniqueIndex('uq_parent_links_parent_student').on(table.parentId, table.studentId),
}));

export type ParentLinkRecord = typeof parentLinks.$inferSelect;
export type NewParentLinkRecord = typeof parentLinks.$inferInsert;

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
  sessionId: varchar('session_id', { length: 100 }).default(''),
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
  // Set when this payment was settled through an online gateway order.
  paymentOrderId: text('payment_order_id'),
  gatewayPaymentId: text('gateway_payment_id'),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_fee_payments_inst').on(table.institutionCode),
  studentIdx: index('idx_fee_payments_student').on(table.studentId),
  feeStructureIdx: index('idx_fee_payments_fee_structure').on(table.feeStructureId),
  statusIdx: index('idx_fee_payments_status').on(table.status),
  paymentOrderIdx: index('idx_fee_payments_payment_order').on(table.paymentOrderId),
}));

export type FeePaymentRecord = typeof feePayments.$inferSelect;
export type NewFeePaymentRecord = typeof feePayments.$inferInsert;

// ---------------------------------------------------------------------------
// Online payments (Razorpay MVP — see PAYMENTS.md)
// ---------------------------------------------------------------------------

/**
 * Per-tenant gateway credentials. Secrets are AES-256-GCM encrypted at rest
 * (shared/utils/encryption.ts) and are NEVER returned by any API response —
 * only the public key_id is exposed to clients for checkout.
 */
export const institutionPaymentConfig = pgTable('institution_payment_config', {
  institutionCode: varchar('institution_code', { length: 100 }).primaryKey(),
  gateway: varchar('gateway', { length: 30 }).notNull().default('razorpay'),
  keyId: varchar('key_id', { length: 255 }).notNull(),
  keySecretEnc: text('key_secret_enc').notNull(),
  webhookSecretEnc: text('webhook_secret_enc').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type InstitutionPaymentConfigRecord = typeof institutionPaymentConfig.$inferSelect;
export type NewInstitutionPaymentConfigRecord = typeof institutionPaymentConfig.$inferInsert;

/**
 * One order per checkout attempt. amount_paise is ALWAYS derived server-side
 * from fee_structures — never from client input.
 *
 * The partial unique index enforces at most ONE open order per student per
 * tenant, which is the race guard against double-paying the same fee lines.
 */
export const paymentOrders = pgTable('payment_orders', {
  id: text('id').primaryKey().$defaultFn(() => `po_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  studentId: text('student_id').notNull(),
  payerUid: text('payer_uid').notNull(),
  payerRole: varchar('payer_role', { length: 30 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('INR'),
  amountPaise: bigint('amount_paise', { mode: 'number' }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('created'),
  gateway: varchar('gateway', { length: 30 }).notNull().default('razorpay'),
  gatewayOrderId: text('gateway_order_id'),
  gatewayPaymentId: text('gateway_payment_id'),
  method: varchar('method', { length: 30 }),
  // Snapshot of the fee lines this order covers (id + amount at creation
  // time) so webhook crediting never re-reads mutable fee_structures.
  feeStructureIds: jsonb('fee_structure_ids').$type<{ id: string; amountPaise: number }[]>().notNull().default([]),
  expiresAt: timestamp('expires_at').notNull(),
  paidAt: timestamp('paid_at'),
  webhookEventId: text('webhook_event_id'),
  failureReason: text('failure_reason'),
  // PII-minimised gateway payload subset for audit (no contact/email/card data).
  gatewayCallback: jsonb('gateway_callback').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_payment_orders_inst').on(table.institutionCode),
  studentIdx: index('idx_payment_orders_student').on(table.studentId),
  statusIdx: index('idx_payment_orders_status').on(table.status),
  gatewayOrderIdIdx: index('idx_payment_orders_gateway_order').on(table.gatewayOrderId),
  webhookEventIdx: uniqueIndex('uq_payment_orders_webhook_event').on(table.webhookEventId),
  gatewayOrderIdUq: uniqueIndex('uq_payment_orders_gateway_order').on(table.gatewayOrderId),
  // At most one open (payable) order per student per tenant.
  openOrderUq: uniqueIndex('uq_payment_orders_open_per_student')
    .on(table.institutionCode, table.studentId)
    .where(sql`status IN ('created', 'authorized')`),
}));

export type PaymentOrderRecord = typeof paymentOrders.$inferSelect;
export type NewPaymentOrderRecord = typeof paymentOrders.$inferInsert;

/** One row per gateway attempt — audit trail + reconciliation source. */
export const paymentTransactions = pgTable('payment_transactions', {
  id: text('id').primaryKey().$defaultFn(() => `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  paymentOrderId: text('payment_order_id').notNull(),
  gateway: varchar('gateway', { length: 30 }).notNull().default('razorpay'),
  gatewayPaymentId: text('gateway_payment_id'),
  amountPaise: bigint('amount_paise', { mode: 'number' }).notNull(),
  method: varchar('method', { length: 30 }),
  status: varchar('status', { length: 30 }).notNull().default('initiated'),
  failureCode: varchar('failure_code', { length: 50 }),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_payment_transactions_inst').on(table.institutionCode),
  orderIdx: index('idx_payment_transactions_order').on(table.paymentOrderId),
  gatewayPaymentIdx: index('idx_payment_transactions_gateway_payment').on(table.gatewayPaymentId),
}));

export type PaymentTransactionRecord = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransactionRecord = typeof paymentTransactions.$inferInsert;

/**
 * Per-institution receipt sequence, consumed with SELECT ... FOR UPDATE
 * inside the payment transaction so receipt numbers are unique under
 * concurrency (replaces the timestamp-derived REC- generator).
 */
export const paymentReceiptSequences = pgTable('payment_receipt_sequences', {
  institutionCode: varchar('institution_code', { length: 100 }).primaryKey(),
  period: varchar('period', { length: 20 }).notNull().default('YYYYMM'),
  nextSeq: integer('next_seq').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type PaymentReceiptSequenceRecord = typeof paymentReceiptSequences.$inferSelect;
export type NewPaymentReceiptSequenceRecord = typeof paymentReceiptSequences.$inferInsert;

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
  // Payroll linkage (generated salary periods + bonuses).
  scheduleId: varchar('schedule_id', { length: 64 }),
  userId: varchar('user_id', { length: 128 }),
  periodKey: varchar('period_key', { length: 64 }),
  dueDate: date('due_date'),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  payrollType: varchar('payroll_type', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_expense_records_inst').on(table.institutionCode),
  categoryIdx: index('idx_expense_records_category').on(table.category),
  statusIdx: index('idx_expense_records_status').on(table.status),
  scheduleIdx: index('idx_expense_records_schedule').on(table.scheduleId).where(sql`schedule_id is not null`),
  uqPeriodKeyIdx: uniqueIndex('uq_expense_period_key').on(table.scheduleId, table.periodKey)
    .where(sql`schedule_id is not null and period_key is not null`),
}));

export type ExpenseRecordRow = typeof expenseRecords.$inferSelect;
export type NewExpenseRecordRow = typeof expenseRecords.$inferInsert;

// =====================================================================
// PAYROLL SCHEDULES (recurring staff salary generation)
// =====================================================================

export const payrollSchedules = pgTable('payroll_schedules', {
  id: text('id').primaryKey().$defaultFn(idPrefix('psc')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  payeeName: varchar('payee_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default(''),
  department: varchar('department', { length: 100 }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull(),
  dayOfMonth: integer('day_of_month'),
  daysOfMonth: jsonb('days_of_month').$type<number[]>().notNull().default([]),
  weekday: integer('weekday'),
  startDate: date('start_date').notNull(),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
  lastGeneratedKey: varchar('last_generated_key', { length: 32 }),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_payroll_schedules_inst').on(table.institutionCode),
  userIdx: index('idx_payroll_schedules_user').on(table.userId),
  uqActiveUserIdx: uniqueIndex('uq_payroll_schedules_active_user')
    .on(table.institutionCode, table.userId)
    .where(sql`active`),
}));

export type PayrollScheduleRow = typeof payrollSchedules.$inferSelect;
export type NewPayrollScheduleRow = typeof payrollSchedules.$inferInsert;

// =====================================================================// NOTIFICATION MODULE SCHEMAS
// =====================================================================
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

// ============================================================================
// LIBRARY MODULE SCHEMAS
// ============================================================================

export const libraryCategories = pgTable('library_categories', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_cat')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description').default(''),
  parentId: text('parent_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_lib_categories_inst').on(table.institutionCode),
  nameUnique: uniqueIndex('uq_lib_categories_inst_name').on(table.institutionCode, table.name),
}));

export type LibraryCategoryRecord = typeof libraryCategories.$inferSelect;
export type NewLibraryCategoryRecord = typeof libraryCategories.$inferInsert;

export const libraryAuthors = pgTable('library_authors', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_auth')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  bio: text('bio').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_lib_authors_inst').on(table.institutionCode),
  nameIdx: index('idx_lib_authors_name').on(table.name),
}));

export type LibraryAuthorRecord = typeof libraryAuthors.$inferSelect;
export type NewLibraryAuthorRecord = typeof libraryAuthors.$inferInsert;

export const libraryBooks = pgTable('library_books', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_bk')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  title: text('title').notNull(),
  isbn: varchar('isbn', { length: 100 }).notNull(),
  publisher: varchar('publisher', { length: 200 }).default(''),
  edition: varchar('edition', { length: 100 }).default(''),
  publicationYear: integer('publication_year'),
  language: varchar('language', { length: 50 }).notNull().default('English'),
  categoryId: text('category_id').notNull(),
  subject: varchar('subject', { length: 200 }).default(''),
  description: text('description').default(''),
  bookType: varchar('book_type', { length: 50 }).notNull().default('TEXTBOOK'),
  coverImage: text('cover_image').default(''),
  keywords: jsonb('keywords').$type<string[]>().default([]),
  authorIds: jsonb('author_ids').$type<string[]>().default([]),
  price: numeric('price', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_lib_books_inst').on(table.institutionCode),
  categoryIdx: index('idx_lib_books_category').on(table.categoryId),
  isbnIdx: index('idx_lib_books_isbn').on(table.isbn),
  isbnUnique: uniqueIndex('uq_lib_books_inst_isbn').on(table.institutionCode, table.isbn),
}));

export type LibraryBookRecord = typeof libraryBooks.$inferSelect;
export type NewLibraryBookRecord = typeof libraryBooks.$inferInsert;

export const libraryBookCopies = pgTable('library_book_copies', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_cpy')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  bookId: text('book_id').notNull(),
  accessionNumber: varchar('accession_number', { length: 100 }).notNull(),
  barcode: varchar('barcode', { length: 100 }).notNull(),
  rack: varchar('rack', { length: 100 }).default('Rack A'),
  shelf: varchar('shelf', { length: 100 }).default('Shelf 1'),
  status: varchar('status', { length: 50 }).notNull().default('AVAILABLE'),
  condition: varchar('condition', { length: 50 }).notNull().default('GOOD'),
  addedAt: date('added_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_lib_copies_inst').on(table.institutionCode),
  bookIdx: index('idx_lib_copies_book').on(table.bookId),
  statusIdx: index('idx_lib_copies_status').on(table.status),
  accessionUnique: uniqueIndex('uq_lib_copies_inst_accession').on(table.institutionCode, table.accessionNumber),
  barcodeUnique: uniqueIndex('uq_lib_copies_inst_barcode').on(table.institutionCode, table.barcode),
}));

export type LibraryBookCopyRecord = typeof libraryBookCopies.$inferSelect;
export type NewLibraryBookCopyRecord = typeof libraryBookCopies.$inferInsert;

export const libraryLoans = pgTable('library_loans', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_ln')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  copyId: text('copy_id').notNull(),
  bookId: text('book_id').notNull(),
  studentId: text('student_id').notNull(),
  issuedBy: text('issued_by').notNull(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  returnDate: date('return_date'),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
  renewalCount: integer('renewal_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_lib_loans_inst').on(table.institutionCode),
  copyIdx: index('idx_lib_loans_copy').on(table.copyId),
  bookIdx: index('idx_lib_loans_book').on(table.bookId),
  studentIdx: index('idx_lib_loans_student').on(table.studentId),
  statusIdx: index('idx_lib_loans_status').on(table.status),
  activeCopyLoanUnique: uniqueIndex('uq_lib_loans_active_copy')
    .on(table.copyId)
    .where(sql`status IN ('ACTIVE', 'OVERDUE')`),
}));

export type LibraryLoanRecord = typeof libraryLoans.$inferSelect;
export type NewLibraryLoanRecord = typeof libraryLoans.$inferInsert;

export const libraryReservations = pgTable('library_reservations', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_res')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  bookId: text('book_id').notNull(),
  studentId: text('student_id').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('WAITING'),
  reservedAt: timestamp('reserved_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_lib_res_inst').on(table.institutionCode),
  bookIdx: index('idx_lib_res_book').on(table.bookId),
  studentIdx: index('idx_lib_res_student').on(table.studentId),
  statusIdx: index('idx_lib_res_status').on(table.status),
}));

export type LibraryReservationRecord = typeof libraryReservations.$inferSelect;
export type NewLibraryReservationRecord = typeof libraryReservations.$inferInsert;

export const libraryFines = pgTable('library_fines', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_fn')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  loanId: text('loan_id'),
  bookCopyId: text('book_copy_id'),
  studentId: text('student_id').notNull(),
  fineType: varchar('fine_type', { length: 50 }).notNull(),
  damageType: varchar('damage_type', { length: 50 }),
  damageNotes: text('damage_notes').default(''),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 50 }).notNull().default('UNPAID'),
  waivedBy: text('waived_by'),
  waivedReason: text('waived_reason').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_lib_fines_inst').on(table.institutionCode),
  studentIdx: index('idx_lib_fines_student').on(table.studentId),
  loanIdx: index('idx_lib_fines_loan').on(table.loanId),
  statusIdx: index('idx_lib_fines_status').on(table.status),
}));

export type LibraryFineRecord = typeof libraryFines.$inferSelect;
export type NewLibraryFineRecord = typeof libraryFines.$inferInsert;

export const libraryPaymentTransactions = pgTable('library_payment_transactions', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_txn')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  fineId: text('fine_id').notNull(),
  receiptNo: varchar('receipt_no', { length: 100 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  cashTendered: numeric('cash_tendered', { precision: 10, scale: 2 }),
  changeReturned: numeric('change_returned', { precision: 10, scale: 2 }),
  transactionRef: text('transaction_ref').default(''),
  scannedQrPayload: text('scanned_qr_payload').default(''),
  paidAt: timestamp('paid_at').defaultNow(),
  cashier: text('cashier').default(''),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_lib_txns_inst').on(table.institutionCode),
  fineIdx: index('idx_lib_txns_fine').on(table.fineId),
  receiptUnique: uniqueIndex('uq_lib_txns_receipt').on(table.institutionCode, table.receiptNo),
}));

export type LibraryPaymentTransactionRecord = typeof libraryPaymentTransactions.$inferSelect;
export type NewLibraryPaymentTransactionRecord = typeof libraryPaymentTransactions.$inferInsert;

export const libraryQuestionPapers = pgTable('library_question_papers', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_pyq')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  title: text('title').notNull(),
  subject: varchar('subject', { length: 200 }).notNull(),
  academicYear: varchar('academic_year', { length: 50 }).notNull(),
  examType: varchar('exam_type', { length: 50 }).notNull(),
  classGrade: varchar('class_grade', { length: 50 }).notNull(),
  totalMarks: integer('total_marks').notNull().default(100),
  durationMinutes: integer('duration_minutes').notNull().default(180),
  fileUrl: text('file_url').default(''),
  fileSize: varchar('file_size', { length: 50 }),
  downloadsCount: integer('downloads_count').notNull().default(0),
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_lib_pyq_inst').on(table.institutionCode),
  subjectIdx: index('idx_lib_pyq_subject').on(table.subject),
  academicYearIdx: index('idx_lib_pyq_year').on(table.academicYear),
  classGradeIdx: index('idx_lib_pyq_class').on(table.classGrade),
}));

export type LibraryQuestionPaperRecord = typeof libraryQuestionPapers.$inferSelect;
export type NewLibraryQuestionPaperRecord = typeof libraryQuestionPapers.$inferInsert;

export const librarySettings = pgTable('library_settings', {
  id: text('id').primaryKey().$defaultFn(idPrefix('lib_set')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  borrowingLimit: integer('borrowing_limit').notNull().default(3),
  loanPeriodDays: integer('loan_period_days').notNull().default(14),
  gracePeriodDays: integer('grace_period_days').notNull().default(2),
  finePerDay: numeric('fine_per_day', { precision: 8, scale: 2 }).notNull().default('1.00'),
  maxFine: numeric('max_fine', { precision: 8, scale: 2 }).notNull().default('100.00'),
  renewalLimit: integer('renewal_limit').notNull().default(2),
  allowReservation: boolean('allow_reservation').notNull().default(true),
  lostBookPenalty: numeric('lost_book_penalty', { precision: 8, scale: 2 }).notNull().default('50.00'),
  damagedBookPenalty: numeric('damaged_book_penalty', { precision: 8, scale: 2 }).notNull().default('25.00'),
  reservationExpiryDays: integer('reservation_expiry_days').notNull().default(7),
  unpaidFineLockThreshold: numeric('unpaid_fine_lock_threshold', { precision: 8, scale: 2 }).notNull().default('20.00'),
  openingHours: varchar('opening_hours', { length: 50 }).default('08:00 AM'),
  closingHours: varchar('closing_hours', { length: 50 }).default('06:00 PM'),
  openOnWeekends: boolean('open_on_weekends').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instUnique: uniqueIndex('uq_lib_settings_inst').on(table.institutionCode),
}));

export type LibrarySettingsRecord = typeof librarySettings.$inferSelect;
export type NewLibrarySettingsRecord = typeof librarySettings.$inferInsert;

// ============================================================================
// ANNOUNCEMENT MODULE SCHEMAS
// ============================================================================

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ann')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('GENERAL'), // GENERAL | ACADEMIC | EVENT | URGENT | NOTICE
  priority: varchar('priority', { length: 20 }).notNull().default('NORMAL'), // LOW | NORMAL | HIGH | URGENT
  status: varchar('status', { length: 20 }).notNull().default('DRAFT'), // DRAFT | SCHEDULED | PUBLISHED | EXPIRED | CANCELLED
  createdBy: text('created_by').notNull(),
  publishAt: timestamp('publish_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  imageUrl: text('image_url').default(''),
  attachmentUrl: text('attachment_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_announcements_institution_code').on(table.institutionCode),
  statusIdx: index('idx_announcements_status').on(table.status),
  typeIdx: index('idx_announcements_type').on(table.type),
  priorityIdx: index('idx_announcements_priority').on(table.priority),
  createdByIdx: index('idx_announcements_created_by').on(table.createdBy),
  publishAtIdx: index('idx_announcements_publish_at').on(table.publishAt),
  expiresAtIdx: index('idx_announcements_expires_at').on(table.expiresAt),
}));

export type AnnouncementRecord = typeof announcements.$inferSelect;
export type NewAnnouncementRecord = typeof announcements.$inferInsert;

export const announcementTargets = pgTable('announcement_targets', {
  id: text('id').primaryKey().$defaultFn(idPrefix('at')),
  announcementId: text('announcement_id').notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull().default('all'), // all | role | class | section
  targetRole: varchar('target_role', { length: 50 }).default(''), // all | student | teacher | parent | staff
  classId: text('class_id').default(''),
  sectionId: text('section_id').default(''),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  announcementIdx: index('idx_announcement_targets_announcement_id').on(table.announcementId),
  targetRoleIdx: index('idx_announcement_targets_target_role').on(table.targetRole),
  classIdx: index('idx_announcement_targets_class_id').on(table.classId),
  sectionIdx: index('idx_announcement_targets_section_id').on(table.sectionId),
}));

export type AnnouncementTargetRecord = typeof announcementTargets.$inferSelect;
export type NewAnnouncementTargetRecord = typeof announcementTargets.$inferInsert;

export const announcementReads = pgTable('announcement_reads', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ar')),
  announcementId: text('announcement_id').notNull(),
  userId: text('user_id').notNull(),
  readAt: timestamp('read_at').defaultNow(),
}, (table) => ({
  announcementIdx: index('idx_announcement_reads_announcement_id').on(table.announcementId),
  userIdx: index('idx_announcement_reads_user_id').on(table.userId),
  annUserUnique: uniqueIndex('uq_announcement_reads_ann_user').on(table.announcementId, table.userId),
}));

export type AnnouncementReadRecord = typeof announcementReads.$inferSelect;
export type NewAnnouncementReadRecord = typeof announcementReads.$inferInsert;

export const admissions = pgTable('admissions', {
  id: text('id').primaryKey().$defaultFn(idPrefix('adm')),
  parentId: text('parent_id').notNull(),
  parentName: text('parent_name').default(''),
  parentEmail: text('parent_email').default(''),
  parentPhone: text('parent_phone').default(''),
  schoolId: text('school_id').notNull(),
  schoolName: text('school_name').default(''),
  childFullName: text('child_full_name').notNull(),
  childAge: integer('child_age').notNull(),
  childGender: varchar('child_gender', { length: 20 }).notNull().default('male'),
  previousSchool: text('previous_school').default(''),
  gradeApplyingFor: varchar('grade_applying_for', { length: 50 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pending'), // pending | test_scheduled | approved | accepted | rejected | offer_declined
  entranceTestDate: timestamp('entrance_test_date'),
  entranceTestVenue: text('entrance_test_venue').default(''),
  entranceTestInstructions: text('entrance_test_instructions').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  parentIdx: index('idx_admissions_parent').on(table.parentId),
  schoolIdx: index('idx_admissions_school').on(table.schoolId),
  statusIdx: index('idx_admissions_status').on(table.status),
}));

export type AdmissionRecord = typeof admissions.$inferSelect;
export type NewAdmissionRecord = typeof admissions.$inferInsert;

/**
 * Email verification tokens (Phase 2 — custom provider).
 *
 * Only the SHA-256 HASH of the token is stored, never the plaintext, so a DB
 * leak cannot be replayed to verify arbitrary addresses. Tokens are
 * single-use (consumedAt set atomically) and short-lived (expiresAt).
 */
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: text('id').primaryKey().$defaultFn(idPrefix('evt')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  // Firebase uid of the account being verified (may be empty for pure-address checks).
  firebaseUid: text('firebase_uid').default(''),
  tokenHash: text('token_hash').notNull(),
  // OTP attempt counter — a wrong code increments this; at the limit the code
  // is consumed so brute-forcing a 6-digit space is bounded to N tries.
  attempts: integer('attempts').notNull().default(0),
  // Sent-at marker used for the per-account resend rate limit.
  sentAt: timestamp('sent_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  consumedAt: timestamp('consumed_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Lookup by token on verify — hash is the fast path, uniqueness is belt-and-braces.
  tokenHashIdx: uniqueIndex('uq_evt_token_hash').on(table.tokenHash),
  // Rate-limit scan: how many sends in the last hour for this address.
  emailSentIdx: index('idx_evt_email_sent').on(table.email, table.sentAt),
  // Cleanup of expired rows.
  expiresIdx: index('idx_evt_expires').on(table.expiresAt),
}));

export type EmailVerificationTokenRecord = typeof emailVerificationTokens.$inferSelect;
export type NewEmailVerificationTokenRecord = typeof emailVerificationTokens.$inferInsert;

/**
 * Bounce / complaint suppression list.
 *
 * An address lands here when SES reports a hard bounce or complaint. Sends to
 * a suppressed address are refused at enqueue time so we stop paying for, and
 * stop harming our reputation with, undeliverable destinations.
 */
export const emailSuppressions = pgTable('email_suppressions', {
  id: text('id').primaryKey().$defaultFn(idPrefix('sup')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  // 'bounce' | 'complaint' | 'manual' — why the address was suppressed.
  reason: varchar('reason', { length: 20 }).notNull().default('bounce'),
  // SES message/event id that caused this, for traceability.
  sesEventId: varchar('ses_event_id', { length: 128 }).default(''),
  detail: text('detail').default(''),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // One suppression row per address per tenant.
  emailUq: uniqueIndex('uq_sup_email_inst').on(table.institutionCode, table.email),
  emailIdx: index('idx_sup_email').on(table.email),
}));

export type EmailSuppressionRecord = typeof emailSuppressions.$inferSelect;
export type NewEmailSuppressionRecord = typeof emailSuppressions.$inferInsert;

/**
 * Per-tenant outbound email identity (Phase 2).
 *
 * SES credentials stay in env (IAM is account-level, not per-tenant); what is
 * per-tenant is the FROM identity — the verified domain/address each school
 * sends as, plus its SES configuration set (used for per-tenant metrics,
 * suppression tracking and dedicated IP pools).
 */
export const institutionEmailConfig = pgTable('institution_email_config', {
  institutionCode: varchar('institution_code', { length: 100 }).primaryKey(),
  // Verified SES sender, e.g. "no-reply@school.edu". Falls back to env default.
  fromEmail: varchar('from_email', { length: 255 }).notNull(),
  fromName: varchar('from_name', { length: 200 }).notNull().default(''),
  replyTo: varchar('reply_to', { length: 255 }).default(''),
  // SES configuration set for per-tenant event/metric publication.
  configurationSet: varchar('configuration_set', { length: 128 }).default(''),
  // Optional verified domain used to derive the from address when fromEmail empty.
  domain: varchar('domain', { length: 255 }).default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type InstitutionEmailConfigRecord = typeof institutionEmailConfig.$inferSelect;
export type NewInstitutionEmailConfigRecord = typeof institutionEmailConfig.$inferInsert;
/**
 * Transport & Bus Tracking Tables
 */

export const busVehicles = pgTable('bus_vehicles', {
  id: text('id').primaryKey().$defaultFn(idPrefix('bv')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  registrationNo: varchar('registration_no', { length: 50 }).notNull(),
  capacity: integer('capacity').notNull().default(30),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active | maintenance | inactive
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instRegUnique: uniqueIndex('uq_bus_vehicles_inst_reg').on(table.institutionCode, table.registrationNo),
}));

export type BusVehicleRecord = typeof busVehicles.$inferSelect;
export type NewBusVehicleRecord = typeof busVehicles.$inferInsert;

export const busRoutes = pgTable('bus_routes', {
  id: text('id').primaryKey().$defaultFn(idPrefix('br')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  vehicleId: text('vehicle_id'),
  driverId: text('driver_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  driverIdx: index('idx_bus_routes_driver').on(table.driverId),
}));

export type BusRouteRecord = typeof busRoutes.$inferSelect;
export type NewBusRouteRecord = typeof busRoutes.$inferInsert;

export const busStops = pgTable('bus_stops', {
  id: text('id').primaryKey().$defaultFn(idPrefix('bs')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  routeId: text('route_id').notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  sequence: integer('sequence').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  routeSeqIdx: index('idx_bus_stops_route_seq').on(table.routeId, table.sequence),
}));

export type BusStopRecord = typeof busStops.$inferSelect;
export type NewBusStopRecord = typeof busStops.$inferInsert;

export const studentTransport = pgTable('student_transport', {
  id: text('id').primaryKey().$defaultFn(idPrefix('st_tr')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  studentId: text('student_id').notNull(),
  routeId: text('route_id').notNull(),
  stopId: text('stop_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  routeIdx: index('idx_student_transport_route').on(table.routeId),
  studentRouteUnique: uniqueIndex('uq_student_transport_student_route').on(table.studentId, table.routeId),
}));

export type StudentTransportRecord = typeof studentTransport.$inferSelect;
export type NewStudentTransportRecord = typeof studentTransport.$inferInsert;

export const busTrips = pgTable('bus_trips', {
  id: text('id').primaryKey().$defaultFn(idPrefix('bt')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  routeId: text('route_id').notNull(),
  driverId: text('driver_id').notNull(),
  tripType: varchar('trip_type', { length: 20 }).notNull(), // pickup | dropoff
  status: varchar('status', { length: 20 }).notNull().default('live'), // live | completed
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
}, (table) => ({
  liveDriverUnique: uniqueIndex('uq_bus_trips_live_driver')
    .on(table.driverId)
    .where(sql`status = 'live'`),
  liveRouteIdx: index('idx_bus_trips_live_route')
    .on(table.routeId)
    .where(sql`status = 'live'`),
}));

export type BusTripRecord = typeof busTrips.$inferSelect;
export type NewBusTripRecord = typeof busTrips.$inferInsert;

export const busLocations = pgTable('bus_locations', {
  tripId: text('trip_id').primaryKey(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  speed: numeric('speed', { precision: 5, scale: 2 }),
  heading: numeric('heading', { precision: 5, scale: 2 }),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type BusLocationRecord = typeof busLocations.$inferSelect;
export type NewBusLocationRecord = typeof busLocations.$inferInsert;

export const schoolNotices = pgTable('school_notices', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ann')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  content: text('content').notNull(),
  targetAudience: varchar('target_audience', { length: 50 }).notNull().default('all'), // all | faculty | students | parents | lab_assistants
  department: varchar('department', { length: 100 }).default(''),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'), // normal | important | urgent
  authorId: text('author_id').notNull(),
  authorName: text('author_name').notNull(),
  authorRole: varchar('author_role', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instIdx: index('idx_school_notices_inst').on(table.institutionCode),
  deptIdx: index('idx_school_notices_dept').on(table.department),
  audienceIdx: index('idx_school_notices_audience').on(table.targetAudience),
  createdIdx: index('idx_school_notices_created').on(table.createdAt),
}));

export type SchoolNoticeRecord = typeof schoolNotices.$inferSelect;
export type NewSchoolNoticeRecord = typeof schoolNotices.$inferInsert;

export const counselingRecords = pgTable('counseling_records', {
  id: text('id').primaryKey().$defaultFn(idPrefix('coun')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  studentId: text('student_id').notNull(),
  studentName: varchar('student_name', { length: 200 }).notNull(),
  gradeSection: varchar('grade_section', { length: 100 }).default(''),
  counselorId: text('counselor_id').notNull(),
  counselorName: varchar('counselor_name', { length: 200 }).notNull(),
  concernCategory: varchar('concern_category', { length: 50 }).notNull(), // attendance_issue | academic_stress | peer_conflict | career_guidance | behavioral
  severity: varchar('severity', { length: 20 }).notNull().default('medium'), // low | medium | high
  actionPlan: text('action_plan').default(''),
  parentContacted: boolean('parent_contacted').default(false),
  status: varchar('status', { length: 30 }).notNull().default('active'), // active | in_progress | resolved
  date: date('date').notNull(),
  lastFollowUpDate: date('last_follow_up_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instIdx: index('idx_counseling_inst').on(table.institutionCode),
  studentIdx: index('idx_counseling_student').on(table.studentId),
  counselorIdx: index('idx_counseling_counselor').on(table.counselorId),
  statusIdx: index('idx_counseling_status').on(table.status),
}));

export type CounselingRecordEntity = typeof counselingRecords.$inferSelect;
export type NewCounselingRecordEntity = typeof counselingRecords.$inferInsert;

export const departmentCourses = pgTable('department_courses', {
  id: text('id').primaryKey().$defaultFn(idPrefix('dc')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  department: varchar('department', { length: 100 }).notNull(),
  semester: varchar('semester', { length: 50 }).notNull(),
  batchYear: varchar('batch_year', { length: 50 }).default(''),
  type: varchar('type', { length: 30 }).notNull().default('theory'), // theory | practical_lab | elective | project
  credits: integer('credits').notNull().default(3),
  instructorId: text('instructor_id').default(''),
  instructorName: varchar('instructor_name', { length: 200 }).default(''),
  instructorRank: varchar('instructor_rank', { length: 50 }).default(''),
  enrolledStudentsCount: integer('enrolled_students_count').default(0),
  totalPlannedHours: integer('total_planned_hours').default(45),
  completedHours: integer('completed_hours').default(0),
  syllabusProgressPct: integer('syllabus_progress_pct').default(0),
  labBatchesCount: integer('lab_batches_count').default(1),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instDeptIdx: index('idx_dept_courses_inst_dept').on(table.institutionCode, table.department),
  instructorIdx: index('idx_dept_courses_instructor').on(table.instructorId),
}));

export type DepartmentCourseEntity = typeof departmentCourses.$inferSelect;
export type NewDepartmentCourseEntity = typeof departmentCourses.$inferInsert;

export const examEligibility = pgTable('exam_eligibility', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ee')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  studentId: text('student_id').notNull(),
  studentName: varchar('student_name', { length: 200 }).notNull(),
  usn: varchar('usn', { length: 50 }).notNull(),
  semester: varchar('semester', { length: 50 }).notNull(),
  department: varchar('department', { length: 100 }).notNull(),
  overallAttendancePct: numeric('overall_attendance_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  coursesBelowThreshold: integer('courses_below_threshold').default(0),
  internalAssessmentScore: numeric('internal_assessment_score', { precision: 5, scale: 2 }).default('0'),
  hallTicketStatus: varchar('hall_ticket_status', { length: 30 }).notNull().default('detained'), // eligible | condonation_needed | detained
  condonationReason: text('condonation_reason').default(''),
  approvedBy: text('approved_by').default(''),
  approvalDate: date('approval_date'),
  remarks: text('remarks').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instDeptIdx: index('idx_exam_eligibility_inst_dept').on(table.institutionCode, table.department),
  studentIdx: index('idx_exam_eligibility_student').on(table.studentId),
  statusIdx: index('idx_exam_eligibility_status').on(table.hallTicketStatus),
}));

export type ExamEligibilityEntity = typeof examEligibility.$inferSelect;
export type NewExamEligibilityEntity = typeof examEligibility.$inferInsert;

// ==========================================
// PLACEMENT CELL SCHEMA
// ==========================================

export const placementMembers = pgTable('placement_members', {
  id: text('id').primaryKey().$defaultFn(idPrefix('pm')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  userId: text('user_id').notNull(),
  accessLevel: varchar('access_level', { length: 20 }).notNull().default('member'), // 'head' | 'member'
  grantedBy: text('granted_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_placement_members_inst').on(table.institutionCode),
  userIdx: index('idx_placement_members_user').on(table.userId),
  userInstUnique: uniqueIndex('uq_placement_members_inst_user').on(table.institutionCode, table.userId),
}));

export type PlacementMemberRecord = typeof placementMembers.$inferSelect;
export type NewPlacementMemberRecord = typeof placementMembers.$inferInsert;

export const studentPlacementProfiles = pgTable('student_placement_profiles', {
  id: text('id').primaryKey().$defaultFn(idPrefix('spp')),
  userId: text('user_id').notNull().unique(),
  fullName: text('full_name').notNull(),
  phone: varchar('phone', { length: 20 }).default(''),
  email: varchar('email', { length: 255 }).notNull(),
  photoUrl: text('photo_url').default(''),
  resumeUrl: text('resume_url').default(''),
  cgpa: numeric('cgpa', { precision: 4, scale: 2 }),
  tenthPercent: numeric('tenth_percent', { precision: 5, scale: 2 }),
  twelfthOrDiplomaPercent: numeric('twelfth_or_diploma_percent', { precision: 5, scale: 2 }),
  activeBacklogs: integer('active_backlogs').default(0),
  portfolioUrl: text('portfolio_url').default(''),
  linkedinUrl: text('linkedin_url').default(''),
  githubUrl: text('github_url').default(''),
  leetcodeUrl: text('leetcode_url').default(''),
  otherLinks: jsonb('other_links').$type<{ name: string; url: string }[]>().default([]),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type StudentPlacementProfileRecord = typeof studentPlacementProfiles.$inferSelect;
export type NewStudentPlacementProfileRecord = typeof studentPlacementProfiles.$inferInsert;

export const placementDrives = pgTable('placement_drives', {
  id: text('id').primaryKey().$defaultFn(idPrefix('pd')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  logoUrl: text('logo_url').default(''),
  bannerUrl: text('banner_url').default(''),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').default(''),
  jobType: varchar('job_type', { length: 50 }).notNull().default('full_time'), // full_time | internship
  ctcOrStipend: varchar('ctc_or_stipend', { length: 100 }).default(''),
  location: varchar('location', { length: 200 }).default(''),
  rounds: jsonb('rounds').$type<{ name: string; description: string; date?: string }[]>().default([]),
  allowedBranches: jsonb('allowed_branches').$type<string[]>().default([]),
  allowedYears: jsonb('allowed_years').$type<string[]>().default([]),
  minCgpa: numeric('min_cgpa', { precision: 4, scale: 2 }),
  maxBacklogs: integer('max_backlogs'),
  applyDeadline: timestamp('apply_deadline').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft | published | closed
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_placement_drives_inst').on(table.institutionCode),
  statusIdx: index('idx_placement_drives_status').on(table.status),
}));

export type PlacementDriveRecord = typeof placementDrives.$inferSelect;
export type NewPlacementDriveRecord = typeof placementDrives.$inferInsert;

export const placementAnnouncements = pgTable('placement_announcements', {
  id: text('id').primaryKey().$defaultFn(idPrefix('pa')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  driveId: text('drive_id'), // nullable for general notices
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  attachmentUrl: text('attachment_url').default(''),
  targetBranches: jsonb('target_branches').$type<string[]>().default([]),
  targetYears: jsonb('target_years').$type<string[]>().default([]),
  isPinned: boolean('is_pinned').notNull().default(false),
  postedBy: text('posted_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_placement_announcements_inst').on(table.institutionCode),
  driveIdx: index('idx_placement_announcements_drive').on(table.driveId),
}));

export type PlacementAnnouncementRecord = typeof placementAnnouncements.$inferSelect;
export type NewPlacementAnnouncementRecord = typeof placementAnnouncements.$inferInsert;

export const driveApplications = pgTable('drive_applications', {
  id: text('id').primaryKey().$defaultFn(idPrefix('da')),
  driveId: text('drive_id').notNull(),
  studentId: text('student_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('applied'), // applied | withdrawn | shortlisted | rejected | selected
  currentRoundIndex: integer('current_round_index').notNull().default(0),
  profileSnapshot: jsonb('profile_snapshot').$type<any>().notNull(),
  resumeUrl: text('resume_url').notNull(),
  appliedAt: timestamp('applied_at').defaultNow(),
  withdrawnAt: timestamp('withdrawn_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  driveIdx: index('idx_drive_applications_drive').on(table.driveId),
  studentIdx: index('idx_drive_applications_student').on(table.studentId),
  statusIdx: index('idx_drive_applications_status').on(table.status),
  driveStudentUnique: uniqueIndex('uq_drive_applications_drive_student').on(table.driveId, table.studentId),
}));

export type DriveApplicationRecord = typeof driveApplications.$inferSelect;
export type NewDriveApplicationRecord = typeof driveApplications.$inferInsert;

export interface QuotaAllocationItem {
  quotaName: string;
  seats: number;
}

export const admissionCourses = pgTable('admission_courses', {
  id: text('id').primaryKey().$defaultFn(idPrefix('ac')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  academicYear: varchar('academic_year', { length: 50 }).notNull(),
  courseCode: varchar('course_code', { length: 50 }).notNull(),
  courseName: text('course_name').notNull(),
  programType: varchar('program_type', { length: 50 }).notNull().default('engineering'), // school | pu | engineering | degree
  totalSeats: integer('total_seats').notNull().default(0),
  quotas: jsonb('quotas').$type<QuotaAllocationItem[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_admission_courses_inst').on(table.institutionCode),
  instYearCodeUnique: uniqueIndex('uq_admission_courses_inst_year_code').on(table.institutionCode, table.academicYear, table.courseCode),
}));

export type AdmissionCourseRecord = typeof admissionCourses.$inferSelect;
export type NewAdmissionCourseRecord = typeof admissionCourses.$inferInsert;

export const admissionApplications = pgTable('admission_applications', {
  id: text('id').primaryKey().$defaultFn(idPrefix('adm')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  academicYear: varchar('academic_year', { length: 50 }).notNull(),
  applicationNumber: varchar('application_number', { length: 50 }).notNull(),
  fullName: text('full_name').notNull(),
  parentPhone: varchar('parent_phone', { length: 20 }).notNull().default(''),
  dob: varchar('dob', { length: 20 }).default(''),
  fatherName: text('father_name').default(''),
  motherName: text('mother_name').default(''),
  guardianPhone: varchar('guardian_phone', { length: 20 }).default(''),
  address: text('address').default(''),
  bloodGroup: varchar('blood_group', { length: 10 }).default(''),
  programType: varchar('program_type', { length: 50 }).default('engineering'),
  preferredCourseId: text('preferred_course_id'),
  preferredCourseName: text('preferred_course_name').default(''),
  // Status: waiting_list | allocated | confirmed | cancelled
  status: varchar('status', { length: 30 }).notNull().default('waiting_list'),
  allocatedCourseId: text('allocated_course_id'),
  allocatedCourseName: text('allocated_course_name').default(''),
  allocatedQuota: varchar('allocated_quota', { length: 50 }).default(''),
  allocatedAt: timestamp('allocated_at'),
  confirmedAt: timestamp('confirmed_at'),
  notes: text('notes').default(''),
  customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),
  createdBy: text('created_by').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_admission_apps_inst').on(table.institutionCode),
  statusIdx: index('idx_admission_apps_status').on(table.status),
  batchIdx: index('idx_admission_apps_batch').on(table.academicYear),
  appNoUnique: uniqueIndex('uq_admission_apps_inst_no').on(table.institutionCode, table.applicationNumber),
}));

export type AdmissionApplicationRecord = typeof admissionApplications.$inferSelect;
export type NewAdmissionApplicationRecord = typeof admissionApplications.$inferInsert;

export const admissionFormConfigs = pgTable('admission_form_configs', {
  id: text('id').primaryKey().$defaultFn(idPrefix('afc')),
  institutionCode: varchar('institution_code', { length: 100 }).notNull(),
  programType: varchar('program_type', { length: 50 }).notNull().default('all'), // school | pu | engineering | degree | all
  fieldKey: varchar('field_key', { length: 100 }).notNull(),
  label: text('label').notNull(),
  fieldType: varchar('field_type', { length: 50 }).notNull().default('text'), // text | number | date | select | boolean | textarea
  options: jsonb('options').$type<string[]>().default([]),
  placeholder: text('placeholder').default(''),
  isRequired: boolean('is_required').notNull().default(false),
  order: integer('order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  instCodeIdx: index('idx_admission_form_configs_inst').on(table.institutionCode),
  instProgKeyUnique: uniqueIndex('uq_admission_form_configs_inst_prog_key').on(table.institutionCode, table.programType, table.fieldKey),
}));

export type AdmissionFormConfigRecord = typeof admissionFormConfigs.$inferSelect;
export type NewAdmissionFormConfigRecord = typeof admissionFormConfigs.$inferInsert;
