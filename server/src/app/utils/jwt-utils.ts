import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import type { JwtPayload } from 'jsonwebtoken';

const generateAccessToken = (payload: JwtPayload) => {
  // @ts-ignore
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as string,
  });
};

const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
};

const generateRefreshToken = (payload: JwtPayload) => {
  // @ts-ignore
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
  });
};

const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
};

const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  return { rawToken, hashedToken };
};

export {
  generateResetToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
