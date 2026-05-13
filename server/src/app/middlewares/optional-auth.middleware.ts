import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt-utils.js';
import { db } from '../../db/index.js';
import { usersTable } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

// Unlike authenticate, this doesn't throw if no token
// It just attaches user if token exists, otherwise moves on
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return next(); // no token = anonymous, that's fine

    const decoded = verifyAccessToken(token);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.id));

    if (user) {
      req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    }
  } catch {
    // invalid token = treat as anonymous, don't throw
  }
  next();
};