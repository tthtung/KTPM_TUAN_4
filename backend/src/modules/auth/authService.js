import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError } from '../../core/errors.js';

export class AuthService {
  /** @param {{userRepo: any, jwtSecret: string}} deps */
  constructor({ userRepo, jwtSecret }) {
    this.userRepo = userRepo;
    this.jwtSecret = jwtSecret;
  }

  async login({ username, password }) {
    const user = await this.userRepo.getByUsername(username);
    if (!user) throw new HttpError(401, 'Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Invalid credentials');

    const token = jwt.sign(
      { sub: user.id, role: user.role, username: user.username },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: { id: user.id, username: user.username, role: user.role }
    };
  }
}
