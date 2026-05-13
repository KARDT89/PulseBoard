import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from '../../common/config/email.js';
import ApiError from '../../common/utils/api-error.js';
import {
  generateAccessToken,
  generateResetToken,
  verifyRefreshToken,
} from '../../common/utils/jwt.utils.js';
import User from './auth.model.js';
import crypto from 'crypto';

const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

const register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already exists');

  const { rawToken, hashedToken } = generateResetToken();

  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken: hashedToken,
  });

  // TODO: send an email to user with token: rawToken
  try {
    await sendVerificationEmail(email, rawToken);
  } catch (err) {
    console.error('Error sending verification email', err);
  }

  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
};

const login = async ({ email, password }) => {
  // take email and find user in db
  // then check if password is correct
  // check if verified or not

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid Email/Password');

  //somehow i will check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  if (!user.isVerified) {
    throw ApiError.forbidden('Please verify your email before login');
  }

  const accessToken = generateAccessToken({ id: user._id });
  const refreshToken = generateResetToken({ id: user._id });

  user.refreshToken = hashToken(refreshToken);

  await user.save({ validateBeforeSave: false });

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};

const refresh = async (token) => {
  if (!token) throw ApiError.unauthorized('Refresh token missing');
  const decoded = verifyRefreshToken(token);

  const user = await User.find(decoded.id).select('+refreshToken');
  if (!user) throw ApiError.unauthorized('User not found');

  if (user.refreshToken !== hashToken(token)) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const accessToken = generateAccessToken({ id: user._id });

  return { accessToken };
};

const logout = async (userId) => {
  // const user = await User.findById(userId).select("+refreshToken")
  // if(!user) throw ApiError.unauthorized("User not found")

  // user.refreshToken = undefined;
  // await user.save({validateBeforeSave: false})

  await User.findByIdAndUpdate(userId, { refreshToken: undefined });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('User not found');

  const { rawToken, hashedToken } = generateResetToken();
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15min

  await user.save({ validateBeforeSave: false });
  //Todo mail bhejna nahi aata
  await sendResetPasswordEmail(email, rawToken);
};

const getMe = async (userID) => {
  const user = await User.findById(userID);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const verifyEmail = async (token) => {
  const hashedToken = hashToken(token);
  const user = await User.findOne({ verificationToken: hashedToken }).select(
    '+verificationToken'
  );
  if (!user) throw ApiError.badRequest('Invalid token');
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save({ validateBeforeSave: false });
  return user;
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }, // token not expired
  });

  if (!user) throw ApiError.badRequest('Invalid or expired token');

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save(); // this triggers your password hash pre-save hook
};

export {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,
};
