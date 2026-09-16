import { Router } from 'express';
import { commentsController } from './comments.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { generalRateLimiter } from '../../middlewares/rateLimit.middleware.js';
import {
  createCommentSchema,
  getCommentsSchema,
  deleteCommentSchema
} from './comments.validators.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(generalRateLimiter);

router.post(
  '/',
  requireRole(['owner', 'admin', 'member']),
  validate(createCommentSchema),
  asyncHandler(commentsController.create)
);

router.get(
  '/',
  requireRole(['owner', 'admin', 'member', 'viewer']),
  validate(getCommentsSchema),
  asyncHandler(commentsController.list)
);

router.delete(
  '/:id',
  requireRole(['owner', 'admin', 'member']), // service layer restricts to author or admin+
  validate(deleteCommentSchema),
  asyncHandler(commentsController.delete)
);

export default router;
