import { z } from 'zod';

const amount = z.coerce.number().positive('amount must be greater than 0').max(999999999);
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const CreateFeeSchema = z.object({
  classSectionId: z.string().max(100).optional(),
  title: z.string().min(1, 'title is required').max(255),
  category: z.string().max(50).optional().default('student_fee'),
  amount,
  term: z.string().max(100).optional(),
  academicYear: z.string().max(20).optional(),
  dueDate: z.string().regex(dateRegex, 'dueDate must be YYYY-MM-DD').optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional().default('active'),
  createdBy: z.string().optional(),
});

export const UpdateFeeSchema = CreateFeeSchema.partial();

export const CreateFeePaymentSchema = z.object({
  feeStructureId: z.string().min(1, 'feeStructureId is required').max(100),
  studentId: z.string().min(1, 'studentId is required').max(100),
  amount,
  paymentMethod: z.enum(['upi', 'cash', 'card', 'bank_transfer', 'cheque', 'online']).optional().default('upi'),
  paymentDate: z.string().regex(dateRegex, 'paymentDate must be YYYY-MM-DD').optional(),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional().default('paid'),
  notes: z.string().max(1000).optional(),
  createdBy: z.string().optional(),
});

export const UpdateFeePaymentSchema = CreateFeePaymentSchema.partial();

export const CreateExpenseSchema = z.object({
  title: z.string().min(1, 'title is required').max(255),
  category: z.enum(['salary', 'bus_fuel', 'bus_maintenance', 'bus_expense', 'hostel_expense', 'utility', 'maintenance', 'other']).optional().default('other'),
  payeeName: z.string().min(1, 'payeeName is required').max(255),
  employeeId: z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  vehicleNo: z.string().max(50).optional(),
  amount,
  paymentMethod: z.enum(['upi', 'cash', 'card', 'bank_transfer', 'cheque']).optional().default('bank_transfer'),
  paymentDate: z.string().regex(dateRegex, 'paymentDate must be YYYY-MM-DD').optional(),
  status: z.enum(['pending', 'paid', 'overdue']).optional().default('paid'),
  notes: z.string().max(1000).optional(),
  createdBy: z.string().optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

// --- POST /admin/users (institution-side user creation) ---

const phoneLike = z
  .string()
  .trim()
  .max(20)
  .refine((v) => v === '' || /^\+?[\d\s-]{7,20}$/.test(v), {
    message: 'must be 7-20 digits (may include +, spaces or dashes)',
  });

// Role is a plain string here — allowed values depend on institution type
// (school vs college) and are validated in admin.service.createUser against
// SCHOOL_ROLES / COLLEGE_ROLES. Password strength is enforced there too via
// validatePasswordStrength (shared policy with change-password).
export const CreateUserSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  role: z.string().trim().min(1, 'Role is required').max(50),
  roles: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
  phone: phoneLike.optional(),
  parentPhone: phoneLike.optional(),
  employeeId: z.string().trim().max(100).optional(),
  rollNoOrUSN: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  academicYear: z.string().trim().max(100).optional(),
  section: z.string().trim().max(100).optional(),
  title: z.string().trim().max(100).optional(),
  password: z.string().max(100).optional(),
  // Overridden from the authenticated session in createUserHandler.
  institutionCode: z.string().trim().max(50).optional(),
  institutionName: z.string().trim().max(150).optional(),
  institutionType: z.enum(['school', 'college']).optional(),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  pincode: z.string().trim().max(10).optional(),
  alternatePhone: phoneLike.optional(),
  occupation: z.string().trim().max(100).optional(),
  emergencyContact: phoneLike.optional(),
  preferredLanguage: z.string().trim().max(30).optional(),
  vehicleNumber: z.string().trim().max(20).optional(),
  licenseNumber: z.string().trim().max(30).optional(),
  /** parent only — Father | Mother | Guardian */
  relation: z.string().trim().max(20).optional(),
  /** admission_officer only — quota category name (e.g. "Management Quota") */
  categoryName: z.string().trim().max(100).optional(),
  /** admission_officer only — seats available under the category */
  seats: z.number().int().min(0).max(1000000).optional(),
  /** admission_officer only — already-created classes (school) / departments (college) */
  classSections: z.array(z.string().trim().min(1).max(150)).max(50).optional(),
  /** admission_officer only — assigned fee structures (class + amount) */
  feeStructureIds: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
  /** parent only — at least one student, keyed by student id */
  children: z
    .array(
      z.object({
        studentId: z.string().trim().min(1).max(100),
        name: z.string().trim().max(100).optional(),
        relationship: z.string().trim().max(50).optional(),
        permissions: z.array(z.string().trim().max(50)).max(20).optional(),
      })
    )
    .max(20)
    .optional(),
  notificationPrefs: z
    .object({
      pushEnabled: z.boolean().optional(),
      disabledTypes: z.array(z.string().trim().max(50)).max(50).optional(),
    })
    .optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// --- POST /admin/bulk-create (CSV bulk import: one role per request) ---

export const BulkCreateRecordSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName is required').max(100),
  lastName: z.string().trim().min(1, 'lastName is required').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(255),
  phone: phoneLike.optional(),
  password: z.string().max(100).optional(),
  rollNoOrUSN: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  academicYear: z.string().trim().max(100).optional(),
  section: z.string().trim().max(100).optional(),
  employeeId: z.string().trim().max(100).optional(),
  /** parent only — Father | Mother | Guardian */
  relation: z.string().trim().max(20).optional(),
  /** parent only — student email addresses to link */
  childEmails: z.array(z.string().trim().toLowerCase().email()).max(20).optional(),
  /** admission_officer only */
  categoryName: z.string().trim().max(100).optional(),
  /** admission_officer only */
  seats: z.number().int().min(0).max(1000000).optional(),
});

export const BulkCreateUsersSchema = z.object({
  role: z.string().trim().min(1).max(50),
  records: z.array(BulkCreateRecordSchema).min(1, 'At least one record is required').max(500),
});

export type BulkCreateRecordInput = z.infer<typeof BulkCreateRecordSchema>;
