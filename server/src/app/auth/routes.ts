import { Router } from 'express';
import validate from '../middlewares/validate.middleware.js';
import { RegisterDto } from './dto/register.dto.js';
import * as controller from './controller.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { authenticate, authorize } from './middleware.js';

const router: Router = Router();

router.post('/register', validate(RegisterDto), controller.register);
router.get('/verify-email/:token', controller.verifyEmail);

router.post('/login', validate(LoginDto), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);

router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password/:token', validate(ResetPasswordDto), controller.resetPassword);

router.get('/getMe', authenticate, authorize('seller', 'customer'), controller.me);

export default router;
