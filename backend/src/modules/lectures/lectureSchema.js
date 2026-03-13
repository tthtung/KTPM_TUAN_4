import { z } from 'zod';

export const statusEnum = z.enum(['draft', 'pending', 'published']);

export const lectureCreateSchema = z.object({
  title: z.string().trim().min(1),
  week: z.coerce.number().int().min(1),
  courseId: z.string().trim().min(1).optional(),
  chapter: z.string().trim().optional().default(''),
  content: z.string().optional().default(''),
  status: statusEnum.optional().default('draft'),
  // Backward-compat: older UI can still send isPublic
  isPublic: z.coerce.boolean().optional()
});

export const lectureUpdateSchema = lectureCreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: 'At least one field must be provided' }
);

export const lectureQuerySchema = z.object({
  q: z.string().trim().optional(),
  week: z.coerce.number().int().min(1).optional(),
  courseId: z.string().trim().min(1).optional(),
  status: statusEnum.optional()
});
