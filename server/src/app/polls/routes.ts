import { Router } from 'express';
import { authenticate } from '../auth/middleware.js';
import { optionalAuthenticate } from '../middlewares/optional-auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { CreatePollDto } from './dto/create-polls.dto.js';
import { SubmitResponseDto } from './dto/submit-response.dto.js';
import * as controller from './controller.js';

const router: Router = Router();

// Protected — must be logged in to create
router.post('/', authenticate, validate(CreatePollDto), controller.createPoll);

// Public — anyone can view a poll to respond
router.get('/:pollId', controller.getPoll);

// Optional auth — anonymous polls accept anyone, authenticated polls require login
router.post('/:pollId/respond', optionalAuthenticate, validate(SubmitResponseDto), controller.submitResponse);

// Protected — only creator can see analytics
router.get('/:pollId/analytics', authenticate, controller.getAnalytics);

// Protected — only creator can publish
router.patch('/:pollId/publish', authenticate, controller.publishResults);

export default router;