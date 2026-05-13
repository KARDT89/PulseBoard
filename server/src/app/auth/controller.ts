import type { Request, Response } from 'express';
import ApiResponse from '../utils/api-response.js';
import * as authService from './service.js';
import ApiError from '../utils/api-errors.js';

const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  ApiResponse.created(res, 'Registration success', user);
};

const login = async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  ApiResponse.ok(res, 'Login success', { user, accessToken, refreshToken });
};

const refresh = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  const { accessToken, refreshToken } = await authService.refresh(token);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  ApiResponse.ok(res, 'Token refreshed', { accessToken });
};

const me = async (req: Request, res: Response) => {
  ApiResponse.ok(res, 'User profile', { user: req.user });
};

const logout = async (req: Request, res: Response) => {
  const user = await authService.logout(req.user.id);
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  ApiResponse.ok(res, 'Successfully logged out', user);
};

const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await authService.forgotPassword(email);
  ApiResponse.ok(res, 'Password reset email sent', user);
};

const resetPassword = async (req: Request, res: Response) => {
  const { password } = req.body;
  const { token } = req.params;
  const user = await authService.resetPassword(token, password);
  ApiResponse.ok(res, 'Password reset successful', user);
};

const verifyEmail = async (req: Request, res: Response) => {
  try{
    const {token} = req.params;
    
    const user = await authService.verifyEmail(token);
    ApiResponse.ok(res, 'Email verified successfully', user);
  } catch (error) {
    ApiError.badRequest(error instanceof Error ? error.message : 'Email verification failed');
  }
};

export { register, login, refresh, logout, me, forgotPassword, resetPassword, verifyEmail };
