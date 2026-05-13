import ApiResponse from '../../common/utils/api-response.js';
import * as authService from './auth.service.js';
import ApiError from '../../common/utils/api-error.js';

const register = async (req, res) => {
  //something
  const user = await authService.register(req.body);
  ApiResponse.created(res, 'Registration success', user);
  // After successful registration, redirect to a page that instructs the user to check their email for verification
  //  res.redirect(`/api/auth/check-email?email=${user.email}`)
};

const login = async (req, res) => {
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

  ApiResponse.ok(res, 'Login successful', { user, accessToken });
};

const logout = async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  ApiResponse.ok(res, 'Logout successful');
};

const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  if (!user) throw ApiError.notFound('User not found');
  ApiResponse.ok(res, 'User fetched successfully', user);
};

const verifyEmail = async (req, res) => {
  const user = await authService.verifyEmail(req.params.token);
  ApiResponse.ok(res, 'Email verified successfully', user);
};

const forgotPassword = async (req, res) => {
  const user = await authService.forgotPassword(req.body.email);
  ApiResponse.ok(res, 'Reset email sent', user);
};

const resetPassword = async (req, res) => {
  const user = await authService.resetPassword(
    req.params.token,
    req.body.password
  );
  ApiResponse.ok(res, 'Password reset successful', user);
};

export {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
