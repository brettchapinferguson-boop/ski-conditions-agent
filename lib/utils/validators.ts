import { z } from 'zod';

// Request validation schemas using Zod

export const ConditionsRequestSchema = z.object({
  resortName: z.string().min(1, 'Resort name is required'),
  resortUrl: z.string().url().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }).optional(),
});

export const ForecastRequestSchema = z.object({
  location: z.union([
    z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    }),
    z.object({
      name: z.string().min(1),
    }),
  ]),
  days: z.number().min(1).max(14).optional().default(7),
});

export const FindBestRequestSchema = z.object({
  region: z.string().optional(),
  radius: z.object({
    center: z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    }),
    miles: z.number().min(1).max(500),
  }).optional(),
  criteria: z.object({
    powder: z.boolean().optional(),
    groomed: z.boolean().optional(),
    park: z.boolean().optional(),
  }).optional(),
});

// Validate and parse request
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
