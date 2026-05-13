import { Router } from 'express';
import * as controller from './auth.controller.js';
import validate from '../../common/middleware/validate.middleware.js';
import RegisterDto from './dto/register.dto.js';
import { authenticate } from './auth.middleware.js';
import LoginDto from './dto/login.dto.js';
import ResetPasswordDto from './dto/reset-password.dto.js';
import { verifyEmail } from './auth.service.js';
import verifyEmailDto from './dto/verify-email.dto.js';

const router = Router();

router.post('/register', validate(RegisterDto), controller.register);
router.post('/login', validate(LoginDto), controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getMe);
router.get(
  '/verify-email/:token',
  validate(verifyEmailDto),
  controller.verifyEmail
);
router.post('/forgot-password', controller.forgotPassword);
router.post(
  '/reset-password/:token',
  validate(ResetPasswordDto),
  controller.resetPassword
);

// View routes — serve EJS pages
router.get('/login', (req, res) =>
  res.render('auth/login', { error: null, success: null })
);
router.get('/register', (req, res) =>
  res.render('auth/register', { error: null, success: null })
);
router.get('/forgot-password', (req, res) =>
  res.render('auth/forgot-password', { error: null, success: null })
);
router.get('/reset-password/:token', (req, res) =>
  res.render('auth/reset-password', {
    token: req.params.token,
    error: null,
    success: null,
  })
);
router.get('/check-email', (req, res) =>
  res.render('auth/check-email', { email: req.query.email })
);

export default router;
