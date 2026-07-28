import { z } from 'zod';

export const SingleFeedSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  rollNoOrUSN: z.string().min(1, 'Roll No / USN is required'),
  email: z.string().email('Invalid email address'),
  dummyPassword: z.string().min(6, 'Password must be at least 6 characters'),
  institutionCode: z.string().min(1, 'School/College code is required'),
  institutionName: z.string().min(1, 'School/College name is required'),
  institutionType: z.enum(['school', 'college']).default('school'),
  role: z.enum(['student', 'teacher']).default('student'),
});

export const BulkFeedArraySchema = z.array(SingleFeedSchema).min(1, 'CSV must contain at least one valid record');

export type SingleFeedInput = z.infer<typeof SingleFeedSchema>;
