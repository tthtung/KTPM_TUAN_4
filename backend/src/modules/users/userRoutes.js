import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../../core/asyncHandler.js';
import { HttpError } from '../../core/errors.js';

const userCreateSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(6),
  role: z.enum(['admin', 'editor', 'student'])
});

export function buildUserRouter({ userRepo, requireRole }) {
  const router = express.Router();

  router.get(
    '/users',
    requireRole(['admin']),
    asyncHandler(async (_req, res) => {
      const users = await userRepo.listAll();
      // Do not return password hashes
      res.json(users.map((u) => ({ id: u.id, username: u.username, role: u.role, createdAt: u.createdAt })));
    })
  );

  router.post(
    '/users',
    requireRole(['admin']),
    asyncHandler(async (req, res) => {
      const input = userCreateSchema.parse(req.body);
      const existing = await userRepo.getByUsername(input.username);
      if (existing) throw new HttpError(409, 'Username already exists');

      const passwordHash = await bcrypt.hash(input.password, 10);
      const created = await userRepo.create({ username: input.username, passwordHash, role: input.role });
      res.status(201).json({ id: created.id, username: created.username, role: created.role, createdAt: created.createdAt });
    })
  );

  return router;
}
