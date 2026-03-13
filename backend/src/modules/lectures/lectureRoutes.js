import express from 'express';
import { asyncHandler } from '../../core/asyncHandler.js';
import { lectureCreateSchema, lectureQuerySchema, lectureUpdateSchema } from './lectureSchema.js';

export function buildLectureRouter({ lectureService, requireRole }) {
  const router = express.Router();

  // Public endpoints
  router.get(
    '/public/lectures',
    asyncHandler(async (_req, res) => {
      const query = lectureQuerySchema.parse(_req.query);
      const lectures = await lectureService.listPublicFiltered(query);
      res.json(lectures);
    })
  );

  router.get(
    '/public/lectures/:id',
    asyncHandler(async (req, res) => {
      const lecture = await lectureService.getById(req.params.id, { allowHidden: false });
      res.json(lecture);
    })
  );

  // Admin endpoints (no auth in MVP)
  router.get(
    '/lectures',
    requireRole(['admin', 'editor']),
    asyncHandler(async (_req, res) => {
      const query = lectureQuerySchema.parse(_req.query);
      const lectures = await lectureService.listAllFiltered(query);
      res.json(lectures);
    })
  );

  router.get(
    '/lectures/:id',
    requireRole(['admin', 'editor']),
    asyncHandler(async (req, res) => {
      const lecture = await lectureService.getById(req.params.id, { allowHidden: true });
      res.json(lecture);
    })
  );

  router.post(
    '/lectures',
    requireRole(['admin', 'editor']),
    asyncHandler(async (req, res) => {
      const input = lectureCreateSchema.parse(req.body);
      const created = await lectureService.create(input);
      res.status(201).json(created);
    })
  );

  router.put(
    '/lectures/:id',
    requireRole(['admin', 'editor']),
    asyncHandler(async (req, res) => {
      const patch = lectureUpdateSchema.parse(req.body);
      const updated = await lectureService.update(req.params.id, patch);
      res.json(updated);
    })
  );

  router.delete(
    '/lectures/:id',
    requireRole(['admin']),
    asyncHandler(async (req, res) => {
      const result = await lectureService.remove(req.params.id);
      res.json(result);
    })
  );

  return router;
}
