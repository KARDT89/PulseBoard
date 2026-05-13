import { db } from '../../db/index.js';
import { usersTable } from '../../db/schema.js';
import ApiError from '../utils/api-errors.js';
import { eq } from 'drizzle-orm';
import crypto, { hash } from 'crypto';
import type { RegisterInput } from './dto/register.dto.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt-utils.js';
import { comparePassword, hashPassword } from '../utils/password-hashing.js';
import type { LoginInput } from './dto/login.dto.js';
import { sendResetPasswordEmail, sendVerificationEmail } from '../config/email.js';

const hashToken = (token: string) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

const register = async ({ name, email, password, role }: RegisterInput) => {
  //check if user exists already
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (existing.length > 0) throw ApiError.conflict('Email already exists');

  // generate Reset token
  const { rawToken, hashedToken } = generateResetToken();

  // hash the password before db save
  const hashedPassword = await hashPassword(password);

  // if new user, create a new user
  const result = await db
    .insert(usersTable)
    .values({
      name,
      email,
      password: hashedPassword,
      role,
      verificationToken: hashedToken,
    })
    .returning({ id: usersTable.id });

  // TODO: send an email to user with token: rawToken
  try {
    await sendVerificationEmail(email, rawToken);
  } catch (err) {
    console.error('Error sending verification email', err);
  }

  return { data: { id: result[0]!.id } };
};

const login = async ({ email, password }: LoginInput) => {
  // check if user exists
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (existing.length === 0) throw ApiError.notFound('User not found');
  const user = existing[0]!;

  // check if email is verified
  if (!user.isVerified) throw ApiError.unauthorized('Email not verified');

  // check if password matches
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

  // generete access and refresh tokens
  const accessToken = generateAccessToken({ id: user.id });
  const refreshToken = generateRefreshToken({ id: user.id });

  // hash the reset token before saving to db
  const hashedRefreshToken = hashToken(refreshToken);
  const result = await db
    .update(usersTable)
    .set({ refreshToken: hashedRefreshToken })
    .where(eq(usersTable.id, user.id));

  return { user: user.id, accessToken, refreshToken };
};

const refresh = async (token: string) => {
  if (!token) throw ApiError.unauthorized('Refresh token missing');
  const decoded = verifyRefreshToken(token);

  const user = await db.select().from(usersTable).where(eq(usersTable.id, decoded.id));
  if (user.length === 0) throw ApiError.unauthorized('User not found');

  if (user[0]?.refreshToken !== hashToken(token)) {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  //generate new refreshtoken and access token
  const newRefreshToken = generateRefreshToken({ id: user[0]!.id });
  const accessToken = generateAccessToken({ id: user[0]!.id });
  // hash the refresh token before saving to db

  const hashedRefreshToken = hashToken(newRefreshToken);
  await db
    .update(usersTable)
    .set({ refreshToken: hashedRefreshToken })
    .where(eq(usersTable.id, user[0]!.id));

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId: string) => {
  const user = await db
    .update(usersTable)
    .set({ refreshToken: null })
    .where(eq(usersTable.id, userId));

  return { message: `user with ID ${userId} has been logged out` };
};

const forgotPassword = async (email: string) => {
  const user = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (user.length === 0) throw ApiError.notFound('User not found');

  const { rawToken, hashedToken } = generateResetToken();

  await db
    .update(usersTable)
    .set({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
    })
    .where(eq(usersTable.id, user[0]!.id));

  // send email to user with rawToken
  await sendResetPasswordEmail(email, rawToken);
};

const resetPassword = async (token: any, newPassword: string) => {
  const hashedToken = hashToken(token);
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.resetPasswordToken, hashedToken));
  if (user.length === 0) throw ApiError.badRequest('Invalid or expired reset token');

  const isExpired = user[0]!.resetPasswordExpires! < new Date();
  if (isExpired) throw ApiError.badRequest('Invalid or expired reset token');

  const hashedPassword = await hashPassword(newPassword);

  await db
    .update(usersTable)
    .set({ password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null })
    .where(eq(usersTable.id, user[0]!.id));

  return { message: 'Password reset successful' };
};

const verifyEmail = async (token: any) => {
  const hashedToken = hashToken(token);

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.verificationToken, hashedToken));
  if (user.length === 0) throw ApiError.badRequest('Invalid or expired verification token');

  await db
    .update(usersTable)
    .set({ isVerified: true, verificationToken: null })
    .where(eq(usersTable.id, user[0]!.id));

  return { message: 'Email verified successfully', user: user[0]!.id };
}

export { register, login, refresh, logout, forgotPassword, resetPassword, verifyEmail };
