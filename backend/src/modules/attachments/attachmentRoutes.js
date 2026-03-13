import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { asyncHandler } from '../../core/asyncHandler.js';

export function buildAttachmentRouter({ attachmentService, uploadsDir, requireRole }) {
  const router = express.Router();

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').slice(0, 10);
      cb(null, `${Date.now()}-${nanoid(8)}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 25 * 1024 * 1024 // 25MB
    }
  });

  router.get(
    '/attachments/:id/download',
    asyncHandler(async (req, res) => {
      const a = await attachmentService.getById(req.params.id);
      // If not logged in, only allow downloading attachments of published lectures
      if (!req.user) {
        const lecture = await attachmentService.lectureRepo.getById(a.lectureId);
        if (!lecture || lecture.status !== 'published') {
          res.status(404).json({ message: 'Attachment not found' });
          return;
        }
      }
      const filePath = attachmentService.getDownloadPath(a);
      res.download(filePath, a.originalName);
    })
  );

  router.delete(
    '/attachments/:id',
    requireRole(['admin', 'editor']),
    asyncHandler(async (req, res) => {
      const removed = await attachmentService.remove(req.params.id);
      res.json(removed);
    })
  );

  router.post(
    '/lectures/:lectureId/attachments',
    requireRole(['admin', 'editor']),
    upload.single('file'),
    asyncHandler(async (req, res) => {
      if (!req.file) {
        res.status(400).json({ message: 'Missing file' });
        return;
      }
      const created = await attachmentService.createForLecture({
        lectureId: req.params.lectureId,
        file: req.file
      });
      res.status(201).json(created);
    })
  );

  return router;
}
