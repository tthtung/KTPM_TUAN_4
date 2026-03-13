import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../core/asyncHandler.js';

const courseCreateSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().optional().default('')
});

export function buildCourseRouter({ courseRepo, requireRole }) {
  const router = express.Router();

  router.get(
    '/courses',
    asyncHandler(async (_req, res) => {
      const courses = await courseRepo.listAll();
      res.json(courses);
    })
  );

  router.post(
    '/courses',
    requireRole(['admin', 'editor']),
    asyncHandler(async (req, res) => {
      const input = courseCreateSchema.parse(req.body);
      const created = await courseRepo.create(input);
      res.status(201).json(created);
    })
  );

  return router;
}
