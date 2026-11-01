import type { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async login(req: Request, res: Response) {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.json(result);
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.userId);
    res.json({ user });
  },
};
