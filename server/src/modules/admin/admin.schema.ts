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
