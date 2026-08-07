import { pgTable, text, timestamp, boolean, varchar, jsonb, integer, date, index, uniqueIndex } from 'drizzle-orm/pg-core';

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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  institutionCodeIdx: index('idx_users_institution_code').on(table.institutionCode),
}));

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

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
