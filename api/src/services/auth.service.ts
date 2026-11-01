import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';
import type { JwtPayload } from '../types/index.js';

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    } as jwt.SignOptions);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async hashPassword(password: string): Promise<string> {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    return bcrypt.hash(password, 12);
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || !user.is_active) {
      throw new UnauthorizedError();
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
};
