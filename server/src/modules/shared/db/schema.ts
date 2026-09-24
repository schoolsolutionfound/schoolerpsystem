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
