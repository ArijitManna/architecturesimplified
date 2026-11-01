import { query } from '../config/db.js';
import type { User, UserRole } from '../types/index.js';

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data: {
    name: string;
    email: string;
    password_hash: string;
    role?: UserRole;
  }): Promise<User> {
    const result = await query<User>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.email.toLowerCase(), data.password_hash, data.role || 'USER']
    );
    return result.rows[0];
  },
};
