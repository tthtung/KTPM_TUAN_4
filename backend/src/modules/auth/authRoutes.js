import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../core/asyncHandler.js';

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

export function buildAuthRouter({ authService }) {
  const router = express.Router();

  router.post(
    '/auth/login',
    asyncHandler(async (req, res) => {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);
      res.json(result);
    })
  );

  return router;
}
