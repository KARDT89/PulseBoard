import { verifyAccessToken } from '../utils/jwt-utils.js';
import ApiError from '../utils/api-errors.js';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../db/index.js';
import { usersTable } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: string;
        name: string;
        email: string;
      };
    }
  }
}

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) throw ApiError.unauthorized('Not Authenticated');
  const decoded = verifyAccessToken(token);
  const result = await db.select().from(usersTable).where(eq(usersTable.id, decoded.id));
  const user = result[0];
  if (!user) throw ApiError.unauthorized('User no longer exists');

  req.user = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };
  next();
};

const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
};

export { authenticate, authorize };
