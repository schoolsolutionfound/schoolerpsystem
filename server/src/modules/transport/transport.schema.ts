import { z } from 'zod';

export const StartTripSchema = z.object({
  tripType: z.enum(['pickup', 'dropoff'], {
    errorMap: () => ({ message: "tripType must be either 'pickup' or 'dropoff'" }),
  }),
});

export type StartTripInput = z.infer<typeof StartTripSchema>;

export const UpdateLocationSchema = z.object({
  latitude: z
    .number({ required_error: 'latitude is required' })
    .min(-90, 'latitude must be between -90 and 90')
    .max(90, 'latitude must be between -90 and 90'),
  longitude: z
    .number({ required_error: 'longitude is required' })
    .min(-180, 'longitude must be between -180 and 180')
    .max(180, 'longitude must be between -180 and 180'),
  speed: z.number().min(0, 'speed cannot be negative').max(300, 'speed exceeds realistic limit').optional().nullable(),
  heading: z.number().min(0, 'heading must be between 0 and 360').max(360, 'heading must be between 0 and 360').optional().nullable(),
});

export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;
