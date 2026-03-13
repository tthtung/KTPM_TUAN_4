import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { ZodError } from 'zod';
import { HttpError } from './core/errors.js';
import { store } from './store.js';
import { LectureRepo } from './modules/lectures/lectureRepo.js';
import { AttachmentRepo } from './modules/attachments/attachmentRepo.js';
import { AttachmentService } from './modules/attachments/attachmentService.js';
import { LectureService } from './modules/lectures/lectureService.js';
import { buildLectureRouter } from './modules/lectures/lectureRoutes.js';
import { buildAttachmentRouter } from './modules/attachments/attachmentRoutes.js';
import fs from 'node:fs/promises';
import { UserRepo } from './modules/users/userRepo.js';
import { buildUserRouter } from './modules/users/userRoutes.js';
import { AuthService } from './modules/auth/authService.js';
import { buildAuthRouter } from './modules/auth/authRoutes.js';
import { authOptional, requireRole } from './modules/auth/authMiddleware.js';
import { CourseRepo } from './modules/courses/courseRepo.js';
import { buildCourseRouter } from './modules/courses/courseRoutes.js';
import { ensureSeedData } from './seed.js';

export async function buildApp() {
  await store.init();

  // Lightweight migration to keep db.json compatible across versions.
  const current = await store.read();
  const needsMigration =
    !Array.isArray(current.lectures) ||
    !Array.isArray(current.attachments) ||
    !Array.isArray(current.courses) ||
    !Array.isArray(current.users);

  if (needsMigration) {
    await store.write((db) => {
      db.lectures = db.lectures || [];
      db.attachments = db.attachments || [];
      db.courses = db.courses || [];
      db.users = db.users || [];
      return db;
    });
  }

  const uploadsDir = path.resolve('uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const lectureRepo = new LectureRepo({ store });
  const attachmentRepo = new AttachmentRepo({ store });
  const userRepo = new UserRepo({ store });
  const courseRepo = new CourseRepo({ store });

  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const authService = new AuthService({ userRepo, jwtSecret });

  const attachmentService = new AttachmentService({ attachmentRepo, lectureRepo, uploadsDir });
  const lectureService = new LectureService({ lectureRepo, attachmentService });

  const app = express();

  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin: frontendOrigin,
      credentials: false
    })
  );

  app.use(express.json({ limit: '2mb' }));

  // Attach req.user if Authorization: Bearer <token> is present
  app.use(authOptional(jwtSecret));

  // Seed minimal data for demo (courses + accounts)
  await ensureSeedData({ store, courseRepo, userRepo });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api', buildAuthRouter({ authService }));
  app.use('/api', buildCourseRouter({ courseRepo, requireRole }));
  app.use('/api', buildUserRouter({ userRepo, requireRole }));

  app.use('/api', buildLectureRouter({ lectureService, requireRole }));
  app.use('/api', buildAttachmentRouter({ attachmentService, uploadsDir, requireRole }));

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ZodError) {
      res.status(400).json({ message: 'Validation error', issues: err.issues });
      return;
    }

    // Multer errors
    if (err && err.name === 'MulterError') {
      res.status(400).json({ message: err.message });
      return;
    }

    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof HttpError ? err.message : 'Internal server error';
    res.status(status).json({ message });
  });

  return app;
}
