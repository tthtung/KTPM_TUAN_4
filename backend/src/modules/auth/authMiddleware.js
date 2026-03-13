import jwt from 'jsonwebtoken';
import { HttpError } from '../../core/errors.js';

export function authOptional(jwtSecret) {
  return function authOptionalMw(req, _res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (!token) {
      req.user = null;
      next();
      return;
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = {
        id: payload.sub,
        username: payload.username,
        role: payload.role
      };
      next();
    } catch {
      req.user = null;
      next();
    }
  };
}

export function requireAuth() {
  return function requireAuthMw(req, _res, next) {
    if (!req.user) {
      next(new HttpError(401, 'Unauthorized'));
      return;
    }
    next();
  };
}

export function requireRole(roles) {
  const allowed = new Set(Array.isArray(roles) ? roles : [roles]);
  return function requireRoleMw(req, _res, next) {
    if (!req.user) {
      next(new HttpError(401, 'Unauthorized'));
      return;
    }
    if (!allowed.has(req.user.role)) {
      next(new HttpError(403, 'Forbidden'));
      return;
    }
    next();
  };
}
