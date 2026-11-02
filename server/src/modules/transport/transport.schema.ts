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

const latitudeSchema = z
  .number({ required_error: 'latitude is required' })
  .min(-90, 'latitude must be between -90 and 90')
  .max(90, 'latitude must be between -90 and 90');

const longitudeSchema = z
  .number({ required_error: 'longitude is required' })
  .min(-180, 'longitude must be between -180 and 180')
  .max(180, 'longitude must be between -180 and 180');

export const CreateVehicleSchema = z.object({
  registrationNo: z.string().trim().min(1, 'registrationNo is required').max(50),
  capacity: z.number().int().min(1).max(200).optional(),
  status: z.enum(['active', 'maintenance', 'inactive']).optional(),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export const CreateRouteSchema = z.object({
  name: z.string().trim().min(1, 'Route name is required').max(200),
  vehicleId: z.string().trim().min(1).nullable().optional(),
  driverId: z.string().trim().min(1).nullable().optional(),
});

export const UpdateRouteSchema = CreateRouteSchema.partial();

export const CreateStopSchema = z.object({
  name: z.string().trim().min(1, 'Stop name is required').max(200),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  sequence: z.number().int().min(0).optional(),
});

export const UpdateStopSchema = CreateStopSchema.partial();

export const AssignStudentTransportSchema = z.object({
  studentId: z.string().trim().min(1, 'studentId is required'),
  routeId: z.string().trim().min(1, 'routeId is required'),
  stopId: z.string().trim().min(1, 'stopId is required'),
});

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
export type CreateRouteInput = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;
export type CreateStopInput = z.infer<typeof CreateStopSchema>;
export type UpdateStopInput = z.infer<typeof UpdateStopSchema>;
export type AssignStudentTransportInput = z.infer<typeof AssignStudentTransportSchema>;
